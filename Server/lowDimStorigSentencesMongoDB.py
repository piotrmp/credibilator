# coding: utf-8

import pymongo

import pprint
from bson.son import SON
import io

client = pymongo.MongoClient('localhost', 27017)


db = client["fakeNews"]
col = db["2d"]
colSentences =db["sentences"]

col.drop()
col.create_index([("projection", pymongo.GEO2D)])
col.create_index([('sentenceId', pymongo.ASCENDING)],unique=True)

colSentences.drop()
colSentences.create_index([('sentenceId', pymongo.ASCENDING)],unique=True)

#allURLs = [None]*95902
allURLs = {}
count = 0
with io.open('../data/corpusSourcesU.tsv','r',encoding='utf-8') as inFile:
    for line2 in inFile:
        if (count >0):
            arrayOfValues2 = line2.split("\t")
            #print(arrayOfValues2)
            allURLs[str(arrayOfValues2[1])+str(arrayOfValues2[2])]= arrayOfValues2[4]            
        count = count + 1


with io.open("../data/sentencesU.tsv","r",encoding="utf-8") as infileSent:
    sentenceCount = 0 
    
    #use zip for python 3
    for line2 in infileSent:
        doc = {}
        doc["sentenceId"] = sentenceCount
        arrayOfValues2 = line2.split("\t")
        doc["documentLabel2"] = float(arrayOfValues2[0])
        doc["source"] = arrayOfValues2[1]
        doc["docId"] = str(arrayOfValues2[1])+str(arrayOfValues2[2])
        doc["offsetInit"] = int(arrayOfValues2[3])
        doc["offsetEnd"] = int(arrayOfValues2[4])
        doc["text"] = arrayOfValues2[5]
        doc["url"] = allURLs[str(arrayOfValues2[1])+str(arrayOfValues2[2])]
        sentenceCount = sentenceCount + 1
        
        colSentences.insert_one(doc)

max1 = 0
max2 = 0
min1 = 0
min2 = 0
with io.open('../data/redU500k50p.ssv','r',encoding='utf-8') as inFile:
    for line1 in inFile:
        arrayOfValues = line1.split(" ")
        arrayOfValues[1] = float(arrayOfValues[1])
        arrayOfValues[2] = float(arrayOfValues[2])
        if max1 < arrayOfValues[1]:
            max1 = arrayOfValues[1]
        if max2 < arrayOfValues[2]:
            max2 = arrayOfValues[2]
        if min1 > arrayOfValues[1]:
            min1 = arrayOfValues[1]
        if min2 > arrayOfValues[2]:
            min2 = arrayOfValues[2]
        
def transformValue(value,minVal,maxVal,startVal, rangeVal):
    normValue = (value-minVal)/float(maxVal-minVal)
    newValue = startVal + normValue *rangeVal
    return (newValue)
    
    
with open("../data/redU500k50p.ssv","r") as infileRed:
    counter = 0
    #use zip for python 3
    for line1 in infileRed:
        arrayOfValues = line1.split(" ")
        doc = {}
        
        doc["projection"] = [transformValue(float(arrayOfValues[1]),min1,max1,-90,180), transformValue(float(arrayOfValues[2]),min2,max2,-180,360)]
        sentenceId = int(float(arrayOfValues[0]))
        doc["predictedSentence"] = float(arrayOfValues[3])
        doc["documentLabel"] = float(arrayOfValues[4])
        sentenceDoc =  colSentences.find_one({"sentenceId":sentenceId})
        if (sentenceDoc !=None):
            doc.update(sentenceDoc)
        else:
            doc["sentenceId"] = sentenceId
            print("This shouldn't happen")
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


# with open("d:/Axel/temp/data/red500k50p.ssv","r") as infileRed, open("d:/Axel/temp/data/sentencesAll.tsv","r") as infileSent:
    # sentenceCount = 0 
    # maxX=0
    # maxY=0
    # minX=0
    # minY=0
    
    # for line1, line2 in izip(infileRed, infileSent):
        # arrayOfValues = line1.split(" ")
        # doc = {}
        # doc["sentenceId"] = sentenceCount
        # doc["projection"] = [float(arrayOfValues[1]), float(arrayOfValues[2])]
        # doc["predictedSentence"] = float(arrayOfValues[0])
        # doc["predictedDocument"] = float(arrayOfValues[3])
        # doc["documentLabel"] = float(arrayOfValues[4])
        # arrayOfValues2 = line2.split("\t")
        # doc["documentLabel2"] = float(arrayOfValues2[0])
        # doc["source"] = arrayOfValues2[1]
        # doc["docId"] = int(arrayOfValues2[2])
        # doc["offsetInit"] = int(arrayOfValues2[3])
        # doc["offsetEnd"] = int(arrayOfValues2[4])
        # doc["text"] = arrayOfValues2[5]
        # sentenceCount = sentenceCount + 1
        # if maxX<float(arrayOfValues[2]):
            # maxX = float(arrayOfValues[2])
        # if minX>float(arrayOfValues[2]):
            # minX = float(arrayOfValues[2])
        # if maxY<float(arrayOfValues[1]):
# document      maxY = float(arrayOfValues[1])
        # if minY>float(arrayOfValues[1]):
            # minY = float(arrayOfValues[1])
        # col.insert_one(doc)


# In[48]:


# for doc in col.find({"projection": {"$within": {"$box": [[20, 2], [100, 15]]}}}).limit(3):
    # pprint.pprint(doc)




# colSentences.find_one({"sentenceId":1977481})




# col.find({}).count()


