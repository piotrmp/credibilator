Index data for ANN

Run indexData.py, where

- pathSentences2D = '../data/redU500k50p.ssv' is the representation of 500k sentences in the 2D tSNE space (only the ids are used)
- pathSentencesOrig = '../data/origdimU.ssv' is the representation of each sentence in the original space
- pathDocumentFeatures = '../data/impx.tsv' contains the document features (original space)

#output for hashes (sentences and documents respectively
- pickleFile = "./engine.p"
- pickleFileDocs = "./engineDocs.p"

------------------------------------
Storage on mongoDB -

1- Have mongo running (script assumes port 27017)

Run lowDimStoringSentencesMongoDB.py, where: 

- pathAllSentences = "d:/Axel/temp/data/sentencesAll.tsv" contains the source credibility, domain, document ID, sentence offsets and the actual sentence
- pathReduced500kSentences = "d:/Axel/temp/data/red500k50p.ssv" representation for 500k sentences in low dimensionality. It includes an index of this sentence in the other files (origdim.ssv.gz and sentencesAll.tsv). 

Run lowDimStoringDocumentsMongoDB.py, where: 

- pathDocumentMetadata = '../data/metadata.tsv' contains the source credibility (label), domain, id, title, URL and archived URL
- pathDocument2D = '../data/styleU50pSfixC.ssv'  low dimensional representation of documents (x y label)

===============================
Start server
1)Create a screen: screen -S backend
2)Activate the environment: conda activate credibilatorP3 (for details on the environment check credibilatorenv.txt)
3)navigate to the server folder: cd ./credibilator/Server
4) Run flask

export FLASK_APP=backend.py
flask run --host=0.0.0.0 --port=5001

The packages of the environment credibilatorP3 can be found in credibilatorenv.txt

================================

Front end:
Adjust backendConnector.js the lines:
this.hostName = 'https://cs.uns.edu.ar/';
wsgiSuffix = 'credibilator-wsgi';

with the actual host and endpoint.
        
