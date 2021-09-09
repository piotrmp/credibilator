# Credibilator

This repository contains resources for the article *[When classification accuracy is not enough: Explaining news credibility assessment](https://doi.org/10.1016/j.ipm.2021.102653)* published in the *Special Issue on Dis/Misinformation Mining from Social Media* of the [Information Processing & Management](https://www.journals.elsevier.com/information-processing-and-management) journal.
The research was done within the [HOMADOS](https://homados.ipipan.waw.pl/) project at [Institute of Computer Science](https://ipipan.waw.pl/), Polish Academy of Sciences in cooperation with Institute for Computer Science and Engineering at [CONICET](http://www.conicet.gov.ar/?lan=en) and [Universidad Nacional del Sur](https://www.uns.edu.ar/ingles) in Bahía Blanca, Argentina.

The resources available here are the following:
* an updated corpus including credible and non-credible (*fake*) news documents,
* the Credibilator browser extension for Chrome (install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/credibilator/lalomhplonipaikfmhaebdailpomkblo)),
* source code and data for training the credibility classifiers used,
* server-side source code.

If you need any more information consult [the paper](https://doi.org/10.1016/j.ipm.2021.102653) or contact its authors! 

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

The corpus data are released under the [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) licence.

## Credibilator browser extension for Chrome

### Source code
The source code for Credibilator is available in the [credibilator-extension](credibilator-extension) folder. It was verified to work with Chromium 91.0. The extension uses several external JS libraries:
* [compromise](https://github.com/spencermountain/compromise) under [MIT license](LICENSE-MIT),
* [javascript-lemmatizer](https://github.com/myabu-dev/javascript-lemmatizer) under [MIT license](LICENSE-MIT),
* [TensorFlow.js](https://github.com/tensorflow/tfjs) under [Apache License 2.0](LICENSE-APACHE),
* [D3.js](https://github.com/d3/d3) under [ISC license](LICENSE-ISC).

The source code is released under the [GNU GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.html) licence.

### Using the extension

The easiest way to use the extension is to install it from the [Chrome Web Store](https://chrome.google.com/webstore/detail/credibilator/lalomhplonipaikfmhaebdailpomkblo).

If you want to load the extension from local files (tested with Chromium 91.0), you need to:
1. Open the [extensions configuration panel](chrome://extensions/) and turn the *Developer mode* on (upper right corner),
2. Click *Load unpacked* and select the `credibilator-extension` folder,
3. The extension should appear on the configuration panel,
4. You can now use Credibilator. Whenever you want to check the credibility of a currently browsed page, activate Credbiliator from the *Extensions* menu (to the right of the address bar).

### Video manual

`Credibilator_mp4` contains a video presenting the most important features of the extension in action.

## Credibility classifiers

### Stylometric

To train a stylometric credibility classifier, you first need to generate features from the training documents. Since the model is going to rely on data available to a browser extension, the features have to be generated in a browser environment as well. The code available in `Classifiers/Stylometric/ChromiumFeatureGenerator.java` executes the javascript code in Chromium and collects the feature values. It uses the following arguments:
* `chromeUserDir` -- temporary directory, empty at startup,
* `tempDir` -- temporary directory, empty at startup,
* `corpusDir` -- directory including the corpus data, e.g. *News Style Corpus* collected as above,
* `outputDir` -- directory to store the generated features,
* `batchPath` -- directory with the batch processing javascript code, available in `Classifiers/Stylometric/features`.

The R code in `Classifiers/Stylometric/R/all-credibilator.R` shows how to build a regularised logistic regression model based on the generated features. The resulting model used by the extension could be seen in `credibilator-extension/style/data/features-true.tsv`.

### Neural

The code to convert the corpus to the format used by our neural classifiers is the same as in [previous work](https://github.com/piotrmp/fakestyle/) and could be accessed [here](https://github.com/piotrmp/fakestyle/blob/master/BiLSTMAvg/DataConversion.java). 

The *BiLSTMAvg* model was implemented in *TensorFlow*, using the code available in `Classifiers/Neural`. Subsequently, it was converted to [TensorFlow.js](https://www.tensorflow.org/js) and the result, used for Credibilator, is exported to `credibilator-extension/bilstmavg/data/tfjs-10k-interp-iter`.

## Server-side

If you want to set up your own backend different to the one currently used by the extension, FLASK, mongoDB and nearpy is needed. These are the steps for setting up the backend for Credibilator yourself. It consists of three parts: 1. Index data for ANN, 2. Storage on mongoDB, 3. Start Flask server, 4. Front-end update.

Check `Server/readme.txt` for a detailed explanation. 

