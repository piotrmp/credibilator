# Credibilator

This repository contains resources for the article *[When classification accuracy is not enough: Explaining news credibility assessment](https://XXXXXX.pdf)* published in the *Special Issue on Dis/Misinformation Mining from Social Media* of the [Information Processing & Management](https://www.journals.elsevier.com/information-processing-and-management) journal.
The research was done within the [HOMADOS](https://homados.ipipan.waw.pl/) project at [Institute of Computer Science](https://ipipan.waw.pl/), Polish Academy of Sciences in cooperation with Institute for Computer Science and Engineering at [CONICET](http://www.conicet.gov.ar/?lan=en) and [Universidad Nacional del Sur](https://www.uns.edu.ar/ingles) in Bahía Blanca, Argentina.

The resources available here are the following:
* an updated corpus including credible and non-credible (*fake*) news documents,
* ...

If you need any more information consult [the paper](https://XXXXXX.pdf) or contact its authors! 

## News Style Corpus v2
The corpus used in this research contains 95,900 documents from 199 sources. News Style Corpus v2 is based on a previous corpus (see [article](https://ojs.aaai.org//index.php/AAAI/article/view/5386) and [data](https://github.com/piotrmp/fakestyle)), using work of [PolitiFact](https://www.politifact.com/punditfact/article/2017/apr/20/politifacts-guide-fake-news-websites-and-what-they/) and [Pew Research Center](https://www.journalism.org/2014/10/21/political-polarization-media-habits/) for source-level credibility assessments.
This version is refined by performing plain text extraction through the [unfluff](https://github.com/ageitgey/node-unfluff) library and removing documents with insufficient content.

The folder [NewsStyleCorpus2](NewsStyleCorpus2) contains the following files necessary to retrieve the pages constituting the corpus from the *[WayBackMachine](https://web.archive.org/)* archive:
* `corpusSourcesU.tsv`: tab-separated list of all documents in the corpus, each with the website (domain) it comes from and its credibility label, original page URL and the address, under which the document is currently available at the archive,
* `NewsDownloader-2.0-jar-with-dependencies.jar`: a Java package that retrieves HTML documents from the given address list and converts them to plain text (*NOTE:* you will need [unfluff](https://github.com/ageitgey/node-unfluff) installed in your system and available through the `unfluff` command),
* `CredibilityCorpusDownloaderU.java`: source code for the above package,
* `foldsCVU.tsv`: a list of fold identifiers for the documents from `corpusSourcesU.tsv` (in the same order) for two CV scenarios described in the paper: document-based and source-based.

You can start download by a simple command:
```
java -jar NewsDownloader-2.0-jar-with-dependencies.jar /path/to/corpusSourcesU.tsv /path/to/output-dir
```
Mind that downloading the whole corpus takes several hours. In order to limit the load on the *WayBackMachine* infrastructure and retrieve all the pages (some may be temporarily unavailable), you should perform the process in stages. You can select just part of the corpus for download by modifying the address list.

