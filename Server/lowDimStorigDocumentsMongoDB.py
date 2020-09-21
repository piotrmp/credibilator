    # coding: utf-8

import pymongo

import pprint
from bson.son import SON
import io
import random

client = pymongo.MongoClient('localhost', 27017)


db = client["fakeNews"]
colTwoDDocs = db["2ddocs"]
colDocs = db["docs"]

colTwoDDocs.drop()
colTwoDDocs.create_index([("projection", pymongo.GEO2D)])
colTwoDDocs.create_index([('docId', pymongo.ASCENDING)],unique=True)

colDocs.drop()
colDocs.create_index([('docId', pymongo.ASCENDING)],unique=True)

allURLs = [None]*95900
docLabels = [None]*95900
sources = [None]*95900
titles = [None]*95900
count = 0
with io.open('../data/metadata.tsv','r',encoding='utf-8') as inFile:
    for line2 in inFile:
        if (count >0):
            arrayOfValues2 = line2.split("\t")
            
            #with fileId
            #allURLs[int(arrayOfValues2[2])]= arrayOfValues2[5]
            #docLabels[int(arrayOfValues2[2])]= arrayOfValues2[0]
            
            #with row as id
            allURLs[count-1]= arrayOfValues2[5]
            docLabels[count-1]= float(arrayOfValues2[0])
            sources[count-1]= arrayOfValues2[1]
            titles[count-1]= arrayOfValues2[3]
            
        count = count + 1


# with io.open("../data/metadata.tsv","r",encoding="utf-8") as infileSent:
    # lineCount = 0 
    
    # #use zip for python 3
    # for line2 in infileSent:
        # if (lineCount >0):
            # doc = {}
            # arrayOfValues2 = line2.split("\t")
            
            # #with fileId
            # #doc["docId"] = int(arrayOfValues2[2])
            
            # #with row as id
            # doc["docId"] = lineCount        
            
            # doc["documentLabel"] = float(arrayOfValues2[0])
            # doc["source"] = arrayOfValues2[1]
            
            
            # doc["text"] = arrayOfValues2[3]
            # doc["url"] = arrayOfValues2[5]
            # doc["oldUrl"] = arrayOfValues2[4]
            
            
            # colDocs.insert_one(doc)
        # lineCount = lineCount + 1

max1 = 0
max2 = 0
min1 = 0
min2 = 0
with io.open('../data/styleU50pSfixC.ssv','r',encoding='utf-8') as inFile:
    for line1 in inFile:
        arrayOfValues = line1.split(" ")
        arrayOfValues[0] = float(arrayOfValues[0])
        arrayOfValues[1] = float(arrayOfValues[1])
        if max1 < arrayOfValues[0]:
            max1 = arrayOfValues[0]
        if max2 < arrayOfValues[1]:
            max2 = arrayOfValues[1]
        if min1 > arrayOfValues[0]:
            min1 = arrayOfValues[0]
        if min2 > arrayOfValues[1]:
            min2 = arrayOfValues[1]
    print(max1)
    print(max2)
    print(min1)
    print(min2)
        
def transformValue(value,minVal,maxVal,startVal, rangeVal):
    normValue = (value-minVal)/float(maxVal-minVal)
    newValue = startVal + normValue *rangeVal
    return (newValue)
    
    
with open("../data/styleU50pSfixC.ssv","r") as infileRed:
    counter = 0
    #use zip for python 3
    for line1 in infileRed:
        arrayOfValues = line1.split(" ")
        doc = {}
        
        doc["projection"] = [transformValue(float(arrayOfValues[0]),min1,max1,-90,180), transformValue(float(arrayOfValues[1]),min2,max2,-180,360)]
        docId = counter
        doc["predictedDoc"] = float(arrayOfValues[2])
        doc["documentLabel"] = docLabels[counter]
        doc["docId"] = counter
        doc["text"] = titles[counter]
        doc["source"] = sources[counter]
        doc["url"] = allURLs[counter]
        doc["random"] = random.randint(0,95900)
        try:
            colTwoDDocs.insert_one(doc)
        except Exception as e:
            print("An exception occurred ::", e)
            print(counter)
            print(doc)
            print(sentenceDoc)
            break
        counter = counter+1
        
        if ((counter % 10000) ==0):
            print(counter)


