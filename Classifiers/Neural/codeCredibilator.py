# Basic variables
dataPath="/PATH/TO/DATA"
batch_size=32
onGPU=False
epochs=10
dataset="all.tsv"

# Reading data
exec(open('./functions.py').read())
# fastText embeddings, downloadable from https://fasttext.cc/docs/en/english-vectors.html
embeddings=readEmbeddings(dataPath+"/word2vec/crawl-300d-2M-subword.vec",top=10000)
MAX_SEQUENCE_LENGTH=120
MAX_DOCUMENT_LENGTH=50
(labels,sources,nums,wordsL,contents,documentCV,topicCV,sourceCV,lengthD)=readDocuments(dataPath+"/fakenews-data/"+dataset,MAX_SEQUENCE_LENGTH,embeddings,MAX_DOCUMENT_LENGTH,unknownLast=True)
embeddingMatrix=prepareEmbeddings(embeddings,wordsL)

# Converting to numpy
y=np.asarray(labels,dtype='float32')
allY=np.concatenate((np.expand_dims(1-y,1),np.expand_dims(y,1)),axis=1)
allX=np.array(contents)

# Preparing mask
mask=lengthToAverageMask(lengthD,MAX_DOCUMENT_LENGTH,binary=False)

# Build one model
exec(open('./modelsCredibilator.py').read())
style1=Style1_UEmb(embeddingMatrix,2,MAX_SEQUENCE_LENGTH,MAX_DOCUMENT_LENGTH,onGPU)
model=style1.getModel()
model.compile(optimizer='adam',loss="binary_crossentropy",metrics=["accuracy"])
fit=model.fit([allX,np.array(mask)],allY, epochs=10,batch_size=batch_size)
styleJS=Style1_JSIter.fromUEmb(style1)
modelJS=styleJS.getModel(interpretable=True)
modelJS.save('style1JSInterpIter_10k_UAll.h5') # Convert to js using tensorflowjs_converter
wordFile=open('words.txt','w')
for word in wordsL:
	wordFile.write(word+'\n')

wordFile.close()








