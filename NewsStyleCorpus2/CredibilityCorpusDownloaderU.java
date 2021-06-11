package pl.waw.ipipan.homados.downloader;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.tuple.Pair;
import org.json.JSONObject;
import org.jsoup.Connection;
import org.jsoup.Connection.Response;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.zeroturnaround.zip.ZipUtil;
import org.zeroturnaround.zip.commons.FileUtils;

// Dependencies: org.jsoup.jsoup 1.10.2, org.apache.commons.commons-lang3 3.8.1 and org.zeroturnaround.zt-zip 1.13
// also executes unfluff 3.2.0
public class CredibilityCorpusDownloader2 {

	public static Pattern rootPattern = Pattern.compile("https?://[\\w\\.-]+(:80)?/");
	public static final String[] HTMLDomains = { "www.angrypatriotmovement.com", "www.anonjekloy.tk", "www.christiantoday.info", "conservativeflashnews.com", "dailyusaupdate.com", "diyhours.net",
			"flashnewscorner.com", "freeinfomedia.com", "globalpoliticsnow.com", "newsconservative.com", "newsjustforyou1.blogspot.com", "newzmagazine.com", "openmagazines.com",
			"www.puppetstringnews.com", "www.religionmind.com", "www.socialeverythings.com", "thepremiumnews.com", "www.whatdoesitmean.com", "www.cnn.com" };
	public static final String blackPrefix = "Organization:\n"
			+ "Starting in 1996, Alexa Internet has been donating their crawl data to the Internet Archive.  Flowing in every day, these data are added to the Wayback Machine after an embargo period.\n"
			+ "Starting in 1996, Alexa Internet has been donating their crawl data to the Internet Archive.  Flowing in every day, these data are added to the Wayback Machine after an embargo period.\n";

	public static Pattern linePattern = Pattern.compile("\r?\n");
	public static Pattern wordPattern = Pattern.compile("\\s+");

	public static void main(String[] args) throws IOException {
		Path inputFile = Paths.get(args[0]);
		Path workDir = Paths.get(args[1]);
		List<String> webSites = exploreSites(inputFile, workDir, 0);
		int counter = 0;
		for (String domain : webSites) {
			++counter;
			if (Files.exists(Paths.get(workDir.toString(), domain + ".zip"))) {
				System.out.println("Done " + domain + ".");
				continue;
			}
			System.out.println("Downloading " + (counter) + "/" + webSites.size() + " " + domain + "...");
			boolean processUnfluff = true;
			for (String htmlDomain : HTMLDomains)
				if (htmlDomain.equals(domain))
					processUnfluff = false;
			Boolean fake = null;
			try {
				fake = downloadSite(domain, inputFile, workDir, processUnfluff, 5);
			} catch (HttpStatusException e) {
				System.out.println("ERROR: Aborting the download of " + domain + " - please try again later.");
				continue;
			}
			BufferedWriter writer = new BufferedWriter(new FileWriter(Paths.get(workDir.toString(), "summary.tsv").toFile(), true));
			writer.write(domain + "\t" + (fake ? "1" : "0") + "\n");
			writer.close();
		}
	}

	private static List<String> exploreSites(Path inputFile, Path workDir, int maxSites) throws IOException {
		Set<String> sitesSet = new HashSet<String>();
		List<String> sitesList = new LinkedList<String>();
		boolean start = true;
		int counter = 0;
		for (String line : Files.readAllLines(inputFile)) {
			if (start) {
				start = false;
				continue;
			}
			String domain = line.split("\t")[1];
			if (!sitesSet.contains(domain)) {
				sitesSet.add(domain);
				sitesList.add(domain);
				if (++counter == maxSites)
					break;
			}
		}
		return sitesList;
	}

	private static Boolean downloadSite(String webSite, Path inputFile, Path workDir, boolean processUnfluffSite, int maxPages) throws IOException {
		Path tmpDir = Paths.get(workDir.toString(), "tmp");
		if (Files.exists(tmpDir)) {
			FileUtils.cleanDirectory(tmpDir.toFile());
			Files.deleteIfExists(tmpDir);
		}
		Files.createDirectory(tmpDir);
		BufferedWriter writer = new BufferedWriter(new FileWriter(Paths.get(tmpDir.toString(), "list.tsv").toFile()));
		Boolean fake = null;
		int counter = 0;
		for (String line : Files.readAllLines(inputFile)) {
			String[] parts = line.split("\t");
			String domain = parts[1];
			if (!domain.equals(webSite))
				continue;
			if (parts[0].equals("0"))
				fake = false;
			else if (parts[0].equals("1"))
				fake = true;
			String pageNo = parts[2];
			String originalURL = parts[3];
			String archivedURL = parts[4];
			boolean processUnfluffPage = processUnfluffSite;
			if (rootPattern.matcher(originalURL).matches()) {
				processUnfluffPage = false;
			}
			System.out.println((processUnfluffPage ? "U " : "H ") + archivedURL);
			Response response = null;
			try {
				response = connectWithRetry(archivedURL, 2);
			} catch (IOException e) {
				System.out.println("Encountered exception: " + e.getMessage());
				System.out.println("Ignoring...");
				if (++counter == maxPages)
					break;
				else
					continue;
			}
			String text = null;
			if (processUnfluffPage)
				text = extractTextUnfluff(response.body(), tmpDir);
			else
				text = extractTextHTML(response.body());
			writeToFile(text, tmpDir, pageNo);
			writer.write(pageNo + "\t" + originalURL + "\t" + archivedURL + "\n");
			if (++counter == maxPages)
				break;
		}
		writer.close();
		ZipUtil.pack(tmpDir.toFile(), Paths.get(workDir.toString(), webSite + ".zip").toFile());
		FileUtils.cleanDirectory(tmpDir.toFile());
		Files.delete(tmpDir);
		return fake;
	}

	private static boolean tooFragmented(String text) {
		int lineNumber = 0;
		Matcher lineMatcher = linePattern.matcher(text);
		while (lineMatcher.find())
			lineNumber++;
		int wordNumber = 0;
		Matcher wordMatcher = wordPattern.matcher(text);
		while (wordMatcher.find())
			wordNumber++;
		if (lineNumber == 0 || (wordNumber / lineNumber < 15))
			return true;
		else
			return false;
	}

	private static void writeToFile(String text, Path workDir, String pageNo) throws IOException {
		BufferedWriter writer = new BufferedWriter(new FileWriter(Paths.get(workDir.toString(), "page" + pageNo + ".txt").toFile()));
		writer.write(text);
		writer.close();
	}

	static Response connectWithRetry(String url, int times) throws IOException {
		for (int i = 0; i < times; ++i) {
			try {
				Connection connection = Jsoup.connect(url);
				connection.timeout(60000);
				Response response = connection.execute();
				return response;
			} catch (HttpStatusException e) {
				int time = ((i + 1) * (i + 1) * (i + 1) * 15);
				if ((e.getStatusCode() >= 500 || e.getStatusCode() == 404) && i != times - 1) {
					System.out.println("[Got " + e.getStatusCode() + ", retrying after " + time + " seconds...]");
					try {
						Thread.sleep(1000 * time);
					} catch (InterruptedException ex) {
						Thread.currentThread().interrupt();
					}
					continue;
				} else
					throw e;
			} catch (ConnectException e) {
				int time = ((i + 1) * (i + 1) * (i + 1) * 15);
				if (i != times - 1) {
					System.out.println("[Got timeout 2, retrying after " + time + " seconds...]");
					try {
						Thread.sleep(1000 * time);
					} catch (InterruptedException ex) {
						Thread.currentThread().interrupt();
					}
					continue;
				} else
					throw e;
			} catch (SocketTimeoutException e) {
				int time = ((i + 1) * (i + 1) * (i + 1) * 15);
				if (i != times - 1) {
					System.out.println("[Got timeout, retrying after " + time + " seconds...]");
					try {
						Thread.sleep(1000 * time);
					} catch (InterruptedException ex) {
						Thread.currentThread().interrupt();
					}
					continue;
				} else
					throw e;
			}
		}
		return null;

	}

	public static String extractTextHTML(String body) {
		Document document = Jsoup.parse(body);
		Elements titles = document.select("title");
		String title = null;
		String content = null;
		if (!titles.isEmpty())
			title = titles.get(0).text();
		// System.out.println("Extracted title: " + title);
		if (document.getElementById("wm-ipp-inside") == null) {
			content = "";
		} else {
			document.getElementById("wm-ipp-inside").remove();
			Element contentEl = findContentElement(document);
			content = justText(contentEl);
			content = cleanse(content);
		}
		return title + "\n\n" + content;
	}

	public static String extractTextUnfluff(String body, Path tmpDir) throws IOException {
		String title = null;
		String content = null;
		Path bodyPath = Paths.get(tmpDir.toString(), "body.html");
		BufferedWriter writer = new BufferedWriter(new FileWriter(bodyPath.toFile()));
		writer.write(body);
		writer.close();
		ProcessBuilder processBuilder = new ProcessBuilder();
		processBuilder.command("unfluff", bodyPath.toString());
		try {
			Process process = processBuilder.start();
			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

			String line;
			String output = "";
			while ((line = reader.readLine()) != null)
				output += line + "\n";

			int exitCode = process.waitFor();
			if (exitCode != 0)
				System.out.println("\nExited with error code : " + exitCode);
			JSONObject obj = new JSONObject(output);
			title = obj.getString("title");
			content = obj.getString("text").replaceAll("\n\n", "\n");
		} catch (IOException e) {
			e.printStackTrace();
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		Files.delete(bodyPath);
		if (content.startsWith(blackPrefix)) {
			System.out.println("Trimming prefix.");
			content = content.substring(blackPrefix.length());
		}
		String result = title + "\n\n" + content;
		return result;
	}

	private static Element findContentElement(Document document) {
		Pair<Element, Integer> best = findBestElement(document, null);
		return best.getLeft();
	}

	private static Pair<Element, Integer> findBestElement(Element element, Pair<Element, Integer> soFar) {
		if (soFar != null && element.html().length() < soFar.getRight())
			return null;
		int textHere = element.text().length();
		int textBelow = 0;
		for (Element child : element.children())
			if (child.text().length() > textBelow)
				textBelow = child.text().length();
		int gain = textHere - textBelow;
		if (soFar == null || gain > soFar.getRight())
			soFar = Pair.of(element, Integer.valueOf(gain));
		for (Element child : element.children()) {
			Pair<Element, Integer> bestBelow = findBestElement(child, soFar);
			if (bestBelow != null && bestBelow.getRight() > soFar.getRight())
				soFar = bestBelow;
		}
		return soFar;
	}

	private static String justText(Element element) {
		if (element.tagName().equals("br"))
			return "\n";
		StringBuilder builder = new StringBuilder("");
		for (Node node : element.childNodes())
			if (node instanceof TextNode)
				builder.append(((TextNode) node).text());
			else if (node instanceof Element)
				builder.append(justText((Element) node));
		if (builder.length() == 0)
			return "";
		else {
			if (element.tagName().equals("li") || element.tagName().equals("p") || element.tagName().equals("div"))
				return "\n" + builder.toString() + "\n";
			else
				return builder.toString();
		}
	}

	private static String cleanse(String text) {
		String[] lines = text.split("\n");
		StringBuilder sb = new StringBuilder();
		for (String line : lines) {
			String trimmed = supertrim(line);
			if (!trimmed.isEmpty()) {
				if (sb.length() != 0)
					sb.append("\n");
				sb.append(trimmed);
			}
		}
		return sb.toString();
	}

	private static String supertrim(String string) {
		return string.replace('\u00A0', ' ').trim();
	}

}
