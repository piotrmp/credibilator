import numpy as np

def readData(dataFile,maxSequenceLength,embeddings,unknownLast):
	labels=[]
	sources=[]
	wordsD={'<PAD>':0}
	wordsL=['<PAD>']
	if not unknownLast:
		wordsD['<UNK>']=1
		wordsL.append('<UNK>')
	else:
		wordsD['<UNK>']=-1
	wordsAll=set()
	contents=[]
	nums=[]
	documentCVs=[]
	topicCVs=[]
	sourceCVs=[]
	fileIn=open(dataFile,'r')
	while True:
		line=fileIn.readline()
		if line=='':
			break
		parts=line.strip().split('\t')
		label=parts[0]
		source=parts[1]
		num=parts[2]
		documentCV=parts[3]
		topicCV=parts[4]
		sourceCV=parts[5]
		contentWords=parts[6:]
		if len(contentWords)>maxSequenceLength:
			contentWords=contentWords[0:maxSequenceLength]
		content=[]
		for contentWord in contentWords:
			wordsAll.add(contentWord)
			if not contentWord in embeddings:
				contentWord='<UNK>'
			elif not contentWord in wordsD:
				wordsD[contentWord]=len(wordsL)
				wordsL.append(contentWord)
			content.append(wordsD[contentWord])
		if len(content)<maxSequenceLength:
			content=content+[0]*(maxSequenceLength-len(content))	
		labels.append(label)
		sources.append(source)
		contents.append(content)
		nums.append(num)
		documentCVs.append(documentCV)
		topicCVs.append(topicCV)
		sourceCVs.append(sourceCV)
	fileIn.close()
	if unknownLast:
		wordsD['<UNK>']=len(wordsD)-1
		wordsL.append('<UNK>')
		for content in contents:
			for i in range(len(content)):
				if content[i]==-1:
					content[i]=wordsD['<UNK>']
	print("Total of "+str(len(wordsAll))+" different words.")
	return(labels,sources,nums,wordsL,contents,documentCVs,topicCVs,sourceCVs)


def readDocuments(dataFile,maxSequenceLength,embeddings,maxDocumentLength,unknownLast=False,onGPU=False):
	(labels,sources,nums,wordsL,contents,documentCVs,topicCVs,sourceCVs)=readData(dataFile,maxSequenceLength,embeddings,unknownLast)
	labelsD=[]
	sourcesD=[]
	numsD=[]
	contentsD=[]
	documentCVsD=[]
	topicCVsD=[]
	sourceCVsD=[]
	lengthsD=[]
	i=0
	contentHere=[]
	if onGPU:
		emptySentence=[wordsL.index('<UNK>')]+[0]*(maxSequenceLength-1)
	else:
		emptySentence=[0]*maxSequenceLength
	while(True):
		contentHere.append(contents[i])
		if i==len(nums)-1 or nums[i+1]!=nums[i]:
			labelsD.append(labels[i])
			sourcesD.append(sources[i])
			numsD.append(nums[i])
			documentCVsD.append(documentCVs[i])
			topicCVsD.append(topicCVs[i])
			sourceCVsD.append(sourceCVs[i])
			if len(contentHere)<maxDocumentLength:
				lengthHere=len(contentHere)
				for j in range(maxDocumentLength-len(contentHere)):
					contentHere.append(emptySentence)
			else:
				lengthHere=maxDocumentLength
				contentHere=contentHere[0:maxDocumentLength]
			lengthsD.append(lengthHere)
			contentsD.append(contentHere)
			contentHere=[]
		i=i+1
		if i==len(nums):
			break
	return(labelsD,sourcesD,numsD,wordsL,contentsD,documentCVsD,topicCVsD,sourceCVsD,lengthsD)


def readEmbeddings(vectorsFile,top=0):
	embeddings={}
	for line in open(vectorsFile):
		parts=line.split()
		if len(parts)!=301:
			print("Ignoring line with "+str(len(parts))+" elements: "+line)
			continue
		coefs=np.asarray(parts[1:],dtype='float32')
		embeddings[parts[0]]=coefs
		if top!=0:
			if len(embeddings)==top:
				break
	return(embeddings)

def prepareEmbeddings(embeddings,wordsL):
	embeddingMatrix = np.zeros((len(wordsL), 300))
	for i in range(len(wordsL)):
		row=np.zeros(300)
		word=wordsL[i]
		if word!='<PAD>' and word!='<UNK>':
			row=embeddings[word]
			row=row/np.sqrt(sum(row*row))
		embeddingMatrix[i]=row
	return(embeddingMatrix)

def splitDocs(sources,nums):
	documents=np.core.defchararray.add(sources, nums)
	documentsu=np.unique(documents)
	np.random.seed(1)
	choice=np.random.choice(range(len(documentsu)),int(0.2*len(documentsu)),False)
	mask=np.isin(documents,documentsu[choice])
	return(mask)

def aggregatePredictions(predictions,sources,nums,whichTest):
	sourcesT=np.array(sources)[whichTest]
	numsT=np.array(nums)[whichTest]
	result={}
	for source in np.unique(sourcesT):
		resulthere={}
		for number in np.unique(numsT[np.isin(sourcesT,source)]):
			meanval=np.mean(predictions[np.logical_and(np.isin(numsT,number),np.isin(sourcesT,source)),1])
			resulthere[number]=meanval
		result[source]=resulthere
	return(result)

def evaluate(resultPred,resultTrue):
	counter=0
	accuracy=0
	for source in resultTrue:
		for num in resultTrue[source]:
			if (resultPred[source][num]>0.5 and resultTrue[source][num]==1.0) or (resultPred[source][num]<0.5 and resultTrue[source][num]==0.0):
				accuracy+=1
			counter+=1
	return(accuracy/counter)

def aggregateFolds(result):
	aggregated={}
	for fold in result.keys():
		for source in result[fold]:
			if not source in aggregated:
				aggregated[source]=result[fold][source]
			else:
				aggregated[source].update(result[fold][source])
	return(aggregated)

def lengthToAverageMask(lengthD,maxDocumentLength,binary=False):
	result=[]
	for i in range(len(lengthD)):
		if binary:
			multiplier=1.0
		else:
			multiplier=maxDocumentLength*1.0/lengthD[i]
		vec=[multiplier,multiplier]
		vec0=[0.0,0.0]
		vector=[vec]*lengthD[i]+[vec0]*(maxDocumentLength-lengthD[i])
		result.append(vector)
	return(np.array(result))

	
def evaluateD(resultPred,resultTrue):
	return(np.mean((resultPred[:,1]>0.5)==(resultTrue[:,1]==1)))

