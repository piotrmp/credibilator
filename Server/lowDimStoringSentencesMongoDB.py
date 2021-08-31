
# coding: utf-8

# In[102]:


import pymongo
from itertools import izip
import pprint
from bson.son import SON
import io

pathAllSentences = "d:/Axel/temp/data/sentencesAll.tsv"
pathReduced500kSentences = "d:/Axel/temp/data/red500k50p.ssv"
                           

# In[2]:


client = pymongo.MongoClient('localhost', 27017)


# In[49]:


db = client["fakeNews"]
col = db["2d"]
colSentences =db["sentences"]


# In[104]:


col.drop()
col.create_index([("projection", pymongo.GEO2D)])
col.create_index([('sentenceId', pymongo.ASCENDING)],unique=True)


# In[107]:


colSentences.drop()
colSentences.create_index([('sentenceId', pymongo.ASCENDING)],unique=True)


# In[108]:


with io.open(pathAllSentences,"r",encoding="utf-8") as infileSent:
    sentenceCount = 0 
    
    #use zip for python 3
    for line2 in infileSent:
        doc = {}
        doc["sentenceId"] = sentenceCount
        arrayOfValues2 = line2.split("\t")
        doc["documentLabel2"] = float(arrayOfValues2[0])
        doc["source"] = arrayOfValues2[1]
        doc["docId"] = int(arrayOfValues2[2])
        doc["offsetInit"] = int(arrayOfValues2[3])
        doc["offsetEnd"] = int(arrayOfValues2[4])
        doc["text"] = arrayOfValues2[5]
        sentenceCount = sentenceCount + 1
        
        colSentences.insert_one(doc)


# In[110]:


with open(pathReduced500kSentences,"r") as infileRed:
    counter = 0
    #use zip for python 3
    for line1 in infileRed:
        arrayOfValues = line1.split(" ")
        doc = {}
        
        doc["projection"] = [float(arrayOfValues[1]), float(arrayOfValues[2])]
        sentenceId = int(float(arrayOfValues[0]))
        doc["predictedSentence"] = float(arrayOfValues[3])
        doc["documentLabel"] = float(arrayOfValues[4])
        sentenceDoc =  colSentences.find_one({"sentenceId":sentenceId})
        if (sentenceDoc !=None):
            doc.update(sentenceDoc)
        else:
            doc["sentenceId"] = sentenceId
        try:
            col.insert_one(doc)
        except Exception as e:
            print("An exception occurred ::", e)
            print(counter)
            print(doc)
            print(sentenceDoc)
            break
        counter = counter+1
        
        if ((counter % 10000) ==0):
            print(counter)


# In[33]:


with open(pathReduced500kSentences,"r") as infileRed, open(pathAllSentences,"r") as infileSent:
    sentenceCount = 0 
    maxX=0
    maxY=0
    minX=0
    minY=0
    #use zip for python 3
    for line1, line2 in izip(infileRed, infileSent):
        arrayOfValues = line1.split(" ")
        doc = {}
        doc["sentenceId"] = sentenceCount
        doc["projection"] = [float(arrayOfValues[1]), float(arrayOfValues[2])]
        doc["predictedSentence"] = float(arrayOfValues[0])
        doc["predictedDocument"] = float(arrayOfValues[3])
        doc["documentLabel"] = float(arrayOfValues[4])
        arrayOfValues2 = line2.split("\t")
        doc["documentLabel2"] = float(arrayOfValues2[0])
        doc["source"] = arrayOfValues2[1]
        doc["docId"] = int(arrayOfValues2[2])
        doc["offsetInit"] = int(arrayOfValues2[3])
        doc["offsetEnd"] = int(arrayOfValues2[4])
        doc["text"] = arrayOfValues2[5]
        sentenceCount = sentenceCount + 1
        if maxX<float(arrayOfValues[2]):
            maxX = float(arrayOfValues[2])
        if minX>float(arrayOfValues[2]):
            minX = float(arrayOfValues[2])
        if maxY<float(arrayOfValues[1]):
document      maxY = float(arrayOfValues[1])
        if minY>float(arrayOfValues[1]):
            minY = float(arrayOfValues[1])
        col.insert_one(doc)


# In[48]:


for doc in col.find({"projection": {"$within": {"$box": [[20, 2], [100, 15]]}}}).limit(3):
    pprint.pprint(doc)


# In[78]:


colSentences.find_one({"sentenceId":1977481})


# In[111]:


col.find({}).count()


# In[103]:


with io.open(pathAllSentences,"r",encoding="utf-8") as infileSent:
    sentenceCount = 0 
    
    
    for line2 in infileSent:
        
        sentenceCount = sentenceCount + 1
        
sentenceCount


# In[86]:


a='dsa'
if a!=None:
    print(a)


# In[92]:


def getSampleAll(sampleSize, sampling):
    if sampling == 'random':
        myresults = list(col.find({}).limit(sampleSize))
    return myresults


# In[112]:


aa=getSampleAll(100,'random')


