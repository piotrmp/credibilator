import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Model
from tensorflow.keras import backend as K

class Style1_JS():
	def __init__(self,embeddingMatrix,labelsNum,maxSequenceLength,maxDocumentLength,weights=(None,None,None)):
		self.maxSequenceLength=maxSequenceLength
		self.maxDocumentLength=maxDocumentLength
		self.labelsNum=labelsNum
		self.embeddingSize=np.shape(embeddingMatrix)[1]
		self.reshapeE1L=keras.layers.Reshape((maxDocumentLength*maxSequenceLength,))
		self.embL=keras.layers.Embedding(np.shape(embeddingMatrix)[0],self.embeddingSize,input_length=maxDocumentLength*maxSequenceLength,weights=[embeddingMatrix],trainable=False,mask_zero=False)
		self.reshapeE2L=keras.layers.Reshape((maxDocumentLength,maxSequenceLength,self.embeddingSize))
		self.reshape1L=keras.layers.Lambda(self.backend_reshape,output_shape=(maxSequenceLength,self.embeddingSize))
		self.masking=keras.layers.Masking()
		self.LSTMforL=keras.layers.LSTM(units=100,go_backwards=False,return_sequences=False,weights=weights[0])
		self.LSTMrevL=keras.layers.LSTM(units=100,go_backwards=True,return_sequences=False,weights=weights[1])
		self.conL=keras.layers.Concatenate(axis=1)
		self.denseL=keras.layers.Dense(labelsNum,activation="softmax",weights=weights[2])
		self.reshape2L=keras.layers.Lambda(self.backend_reshape2,output_shape=(maxDocumentLength,labelsNum))
		self.multiplyL=keras.layers.Multiply()
		self.poolingL=keras.layers.GlobalAveragePooling1D()

	@classmethod
	def fromUEmb(cls,style_uemb):
		embeddingMatrix=style_uemb.embFixed.get_weights()[0]
		valid_words=np.shape(embeddingMatrix)[0]-2
		embeddingMatrix[valid_words+1]=style_uemb.embTrained.get_weights()[0][1]
		weights=(style_uemb.LSTMforL.get_weights(),style_uemb.LSTMrevL.get_weights(),style_uemb.denseL.get_weights())
		result=Style1_JS(embeddingMatrix,style_uemb.labelsNum,style_uemb.maxSequenceLength,style_uemb.maxDocumentLength,weights=weights)
		return(result)

	def backend_reshape(self,x):
		return keras.backend.reshape(x,(-1,self.maxSequenceLength,self.embeddingSize))

	def backend_reshape2(self,x):
		return keras.backend.reshape(x,(-1,self.maxDocumentLength,self.labelsNum))

	def backend_reshape3(self,x):
		return keras.backend.reshape(x,(-1,self.maxDocumentLength,200))

	def getMask(self,lengthD):
		return (lengthToAverageMask(lengthD,self.maxDocumentLength,binary=False))

	def getModel(self,interpretable=False):
		inputWords = keras.layers.Input(shape=(self.maxDocumentLength,self.maxSequenceLength,))
		inputMask = keras.layers.Input(shape=(self.maxDocumentLength,self.labelsNum,))
		allWords=self.reshapeE1L(inputWords)
		embs=self.embL(allWords)
		documentWords=self.reshapeE2L(embs)
		sentences=self.reshape1L(documentWords)
		sentences=self.masking(sentences)
		lstm1=self.LSTMforL(sentences)
		lstm2=self.LSTMrevL(sentences)
		sentenceRep=self.conL([lstm1,lstm2])
		sentencePs=self.denseL(sentenceRep)
		sentencePs=self.reshape2L(sentencePs)
		Ps=self.multiplyL([sentencePs,inputMask])
		Ps=self.poolingL(Ps)
		if interpretable:
			self.reshape3=keras.layers.Lambda(self.backend_reshape3,output_shape=(self.maxDocumentLength,200))
			sentenceRep=self.reshape3(sentenceRep)
			model=Model(inputs=[inputWords,inputMask], outputs=[Ps,sentencePs,sentenceRep])
		else:
			model=Model(inputs=[inputWords,inputMask], outputs=Ps)
		return(model)

class Style1_UEmb():
	def __init__(self,embeddingMatrix,labelsNum,maxSequenceLength,maxDocumentLength,onGPU):
		self.maxSequenceLength=maxSequenceLength
		self.maxDocumentLength=maxDocumentLength
		self.labelsNum=labelsNum
		valid_words=np.shape(embeddingMatrix)[0]-2
		embeddingSize=np.shape(embeddingMatrix)[1]
		self.reshapeE1L=keras.layers.Reshape((maxDocumentLength*maxSequenceLength,))
		self.embFixed=keras.layers.Embedding(np.shape(embeddingMatrix)[0], embeddingSize, input_length=maxDocumentLength*maxSequenceLength,weights=[embeddingMatrix], trainable=False, mask_zero=False)
		self.subtractL = keras.layers.Lambda(lambda x: x - valid_words)
		self.reluL=keras.layers.Activation('relu')
		self.embTrained=keras.layers.Embedding(2, embeddingSize, input_length=maxDocumentLength*maxSequenceLength, trainable=True, mask_zero=False)
		self.repeatL=keras.layers.RepeatVector(embeddingSize)
		self.permuteL=keras.layers.Permute((2,1))
		self.castL=keras.layers.Lambda(lambda x: keras.backend.cast_to_floatx(x))
		self.multiply0L=keras.layers.Multiply()
		self.addL=keras.layers.Add()
		self.reshapeE2L=keras.layers.Reshape((maxDocumentLength,maxSequenceLength,embeddingSize))
		self.reshape1L=keras.layers.Lambda(lambda x: keras.backend.reshape(x,(-1,maxSequenceLength,embeddingSize)),output_shape=(maxSequenceLength,embeddingSize))
		self.masking=keras.layers.Masking()
		self.LSTMforL=keras.layers.LSTM(units=100,go_backwards=False,return_sequences=False)
		self.LSTMrevL=keras.layers.LSTM(units=100,go_backwards=True,return_sequences=False)
		self.conL=keras.layers.Concatenate(axis=1)
		self.denseL=keras.layers.Dense(labelsNum,activation="softmax")
		self.reshape2L=keras.layers.Lambda(lambda x: keras.backend.reshape(x,(-1,maxDocumentLength,labelsNum)),output_shape=(maxDocumentLength,labelsNum))
		self.multiplyL=keras.layers.Multiply()
		self.poolingL=keras.layers.GlobalAveragePooling1D()

	def getMask(self,lengthD):
		return (lengthToAverageMask(lengthD,self.maxDocumentLength,binary=False))

	def getModel(self):
		inputWords = keras.layers.Input(shape=(self.maxDocumentLength,self.maxSequenceLength,))
		inputMask = keras.layers.Input(shape=(self.maxDocumentLength,self.labelsNum,))
		allWords=self.reshapeE1L(inputWords)
		embsNormal=self.embFixed(allWords)
		maskUnknowns=self.reluL(self.subtractL(allWords))
		embsUnknowns=self.embTrained(maskUnknowns)
		embsUnknowns=self.multiply0L([embsUnknowns,self.permuteL(self.repeatL(self.castL(maskUnknowns)))])
		embs=self.addL([embsNormal,embsUnknowns])
		documentWords=self.reshapeE2L(embs)
		sentences=self.reshape1L(documentWords)
		sentences=self.masking(sentences)
		lstm1=self.LSTMforL(sentences)
		lstm2=self.LSTMrevL(sentences)
		sentenceRep=self.conL([lstm1,lstm2])
		Ps=self.denseL(sentenceRep)
		Ps=self.reshape2L(Ps)
		Ps=self.multiplyL([Ps,inputMask])
		Ps=self.poolingL(Ps)
		model=Model(inputs=[inputWords,inputMask], outputs=Ps)
		return(model)

class Style1_JSIter():
	def __init__(self,embeddingMatrix,labelsNum,maxSequenceLength,weights=(None,None,None)):
		self.maxSequenceLength=maxSequenceLength
		self.labelsNum=labelsNum
		self.embeddingSize=np.shape(embeddingMatrix)[1]
		self.embL=keras.layers.Embedding(np.shape(embeddingMatrix)[0],self.embeddingSize,input_length=maxSequenceLength,weights=[embeddingMatrix],trainable=False,mask_zero=False)
		self.masking=keras.layers.Masking()
		self.LSTMforL=keras.layers.LSTM(units=100,go_backwards=False,return_sequences=False,weights=weights[0])
		self.LSTMrevL=keras.layers.LSTM(units=100,go_backwards=True,return_sequences=False,weights=weights[1])
		self.conL=keras.layers.Concatenate(axis=1)
		self.denseL=keras.layers.Dense(labelsNum,activation="softmax",weights=weights[2])
		
	@classmethod
	def fromUEmb(cls,style_uemb):
		embeddingMatrix=style_uemb.embFixed.get_weights()[0]
		valid_words=np.shape(embeddingMatrix)[0]-2
		embeddingMatrix[valid_words+1]=style_uemb.embTrained.get_weights()[0][1]
		weights=(style_uemb.LSTMforL.get_weights(),style_uemb.LSTMrevL.get_weights(),style_uemb.denseL.get_weights())
		result=Style1_JSIter(embeddingMatrix,style_uemb.labelsNum,style_uemb.maxSequenceLength,weights=weights)
		return(result)

	def getModel(self,interpretable=False):
		inputWords = keras.layers.Input(shape=(self.maxSequenceLength,))
		embs=self.embL(inputWords)
		sentences=self.masking(embs)
		lstm1=self.LSTMforL(sentences)
		lstm2=self.LSTMrevL(sentences)
		sentenceRep=self.conL([lstm1,lstm2])
		sentencePs=self.denseL(sentenceRep)
		if interpretable:
			model=Model(inputs=[inputWords], outputs=[sentencePs,sentenceRep])
		else:
			model=Model(inputs=[inputWords], outputs=sentencePs)
		return(model)


