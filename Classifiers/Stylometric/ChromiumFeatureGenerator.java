package pl.waw.ipipan.homados.credibilator;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;

import org.zeroturnaround.zip.ZipUtil;

public class ChromiumFeatureGenerator {

	public static void main(String[] args) throws IOException {
		String chromeUserDir = args[0];
		String tempDir = args[1];
		String corpusDir = args[2];
		String outputDir = args[3];
		String batchPath = args[4];

		Map<String, Integer> featuresCount = new HashMap<String, Integer>();
		BufferedWriter tsvWriter = new BufferedWriter(new FileWriter(Paths.get(outputDir, "train.tsv").toFile()));
		tsvWriter.write("y\tsource\ttopic\n");
		List<String> orderedDomains = new LinkedList<String>();
		Map<String, Map<String, Double>[]> allFeatures = new HashMap<String, Map<String, Double>[]>();
		
		for (String line : Files.readAllLines(Paths.get(corpusDir, "summary.tsv"))) {
			String domain = line.split("\t")[0];
			String fake = line.split("\t")[1];
			File file = Paths.get(corpusDir, domain + ".zip").toFile();
			byte[] listBytes = ZipUtil.unpackEntry(file, "list.tsv");
			BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(listBytes)));
			String line2 = null;
			int counter = 0;
			while ((line2 = reader.readLine()) != null) {
				++counter;
				String[] parts = line2.split("\t");
				int realId = Integer.parseInt(parts[0]);
				int fakeId = counter;
				String name = "page" + realId + ".txt";
				String newName = "case" + fakeId + ".txt";
				ZipUtil.unpackEntry(file, name, Paths.get(tempDir, newName).toFile());
			}
			reader.close();
			Map<String, Double>[] features = handleChromium(chromeUserDir, batchPath, counter);
			orderedDomains.add(domain);
			allFeatures.put(domain, features);
			for (Map<String, Double> map : features)
				for (String feature : map.keySet())
					if (!featuresCount.containsKey(feature))
						featuresCount.put(feature, 1);
					else
						featuresCount.put(feature, featuresCount.get(feature) + 1);
			for (int i = 0; i < counter; ++i)
				Files.delete(Paths.get(tempDir, "case" + (i + 1) + ".txt"));
			System.out.println("Read " + domain);
			for (int i = 0; i < counter; ++i) {
				tsvWriter.write(fake + "\t" + domain + "\t0\n");
			}
		}
		tsvWriter.close();
	
		Map<String, Integer> validFeatures = new HashMap<String, Integer>();
		int counter = 0;
		BufferedWriter wordWriter = new BufferedWriter(new FileWriter(Paths.get(outputDir, "words.tsv").toFile()));
		for (Entry<String, Integer> entry : featuresCount.entrySet())
			if (entry.getValue() >= 200) {
				validFeatures.put(entry.getKey(), ++counter);
				wordWriter.write(entry.getKey() + "\t" + counter + "\n");
			}
		wordWriter.close();
		
		BufferedWriter csrWriter = new BufferedWriter(new FileWriter(Paths.get(outputDir, "train.csr").toFile()));
		for (String domain : orderedDomains) {
			Map<String, Double>[] features = allFeatures.get(domain);
			for (int i = 0; i < features.length; ++i) {
				csrWriter.write("1");
				for (String feature : features[i].keySet())
					if (validFeatures.containsKey(feature))
						csrWriter.write(" " + validFeatures.get(feature) + ":" + features[i].get(feature));
				csrWriter.newLine();
			}
		}
		csrWriter.close();
		
		System.out.println("Saved " + validFeatures.size() + " out of " + featuresCount.size());
		featuresCount = null;
	}

	public static Map<String, Double>[] handleChromium(String chromeUserDir, String batchPath, int items) {
		Map<String, Double>[] result = new Map[items];
		ProcessBuilder processBuilder = new ProcessBuilder();
		processBuilder.command("chromium-browser", "--disable-web-security", "--user-data-dir=" + chromeUserDir, "--enable-logging=stderr", "file://" + batchPath + "?" + items);
		try {
			Process process = processBuilder.start();
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
			String line;
			Map<String, Double> currentFeatures = null;
			int currentId = 0;
			while ((line = reader.readLine()) != null) {
				String[] parts = line.split("\t");
				if (parts.length < 3)
					continue;
				if (parts[1].startsWith("DOING")) {
					currentId = Integer.parseInt(parts[1].split(" ")[1]);
					System.out.println("Reading output from " + currentId);
					currentFeatures = new HashMap<String, Double>();
				} else if (parts[1].startsWith("DONE")) {
					int id = Integer.parseInt(parts[1].split(" ")[1]);
					assert (id == currentId);
					result[id - 1] = currentFeatures;
					System.out.println("Finished output with " + currentFeatures.size() + " features.");
					if (id == 1) {
						process.destroy();
						break;
					}
				} else {
					assert (parts.length == 4);
					String feature = parts[1];
					double value = 0.0;
					try {
						value = Double.parseDouble(parts[2]);
					} catch (NumberFormatException e) {
						System.out.println("ERROR: unable to parse feature from line: " + line);
						continue;
					}
					currentFeatures.put(feature, value);
				}
			}
			int exitCode = process.waitFor();
			TimeUnit.SECONDS.sleep(10);
			if (exitCode != 0)
				System.out.println("\nExited with error code : " + exitCode);
		} catch (IOException e) {
			e.printStackTrace();
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		return result;
	}
}
