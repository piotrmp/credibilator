from __future__ import print_function
from flask import Flask, url_for, json, request, Response
#from flask.ext.cors import CORS, cross_origin
from flask_cors import CORS, cross_origin
import requests

#import json as js
#from decoratorca import crossdomain
import pymongo

import sys
import numpy as np
from nearpy import Engine
from nearpy.hashes import RandomBinaryProjections

import pickle
from pathlib import Path

app = Flask(__name__)

#Necessary to catch pymongo exceptions
app.config['PROPAGATE_EXCEPTIONS'] = True
#Necessary to enable CORS
app.config['CORS_HEADERS'] = 'Content-Type'

cors = CORS(app, resources={r"/getData": {"origins": "*"}})

pickleFile = "./engine.p"
pickleFileDocs = "./engineDocs.p"

@app.route('/')
def api_root():
    return 'Welcome'

    
@app.route('/getData', methods = ['POST'])
def api_getDataAll():
    data = request.json
    nSamples = data["nSamples"] if "nSamples" in data else 500
    range = data["range"] if "range" in data else None
    sampling = data["sampling"] if "sampling" in data else "random"
    
    if range==None:
        if sampling == 'random':
            myresults = list(col.find({},{"_id":0,"documentLabel2":0,"offsetInit":0,"offsetEnd":0}).limit(nSamples))
    else:
        if sampling == 'random':
            myresults = list(col.find({"projection": {"$within": {"$box": range}}},{"_id":0,"documentLabel2":0,"offsetInit":0,"offsetEnd":0}).sort([("docId",1)]).limit(nSamples))
    
    cgi_result={'docs_found':myresults,'type':'sentences'}
    js = json.dumps(cgi_result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp
    
@app.route('/getDataDocs', methods = ['POST'])
def api_getDataDocsAll():
    data = request.json
    nSamples = data["nSamples"] if "nSamples" in data else 500
    range = data["range"] if "range" in data else None
    sampling = data["sampling"] if "sampling" in data else "random"
    
    if range==None:
        if sampling == 'random':
            myresults = list(colDocs.find({},{"_id":0}).limit(nSamples))
    else:
        if sampling == 'random':
            myresults = list(colDocs.find({"projection": {"$within": {"$box": range}}},{"_id":0}).sort([("docId",1)]).limit(nSamples))
    
    cgi_result={'docs_found':myresults,'type':'documents'}
    js = json.dumps(cgi_result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp
    
@app.route('/getANN', methods = ['POST'])
def retrieveNeighborsId():
    data = request.json
    v = np.array(data["query"])
    #v = data["query"] 
    n = data["n"] if "n" in data else 3

    neighbors = engine.neighbours(v)
    count = 0
    result = []
    for neighbor in neighbors:
        count = count + 1
        result.append(int(neighbor[1].split("_")[1]))
        if n==count:
            break
    
    myresults = list(col.find({"sentenceId":{"$in":result}},{"_id":0,"documentLabel2":0,"offsetInit":0,"offsetEnd":0}))
    
    cgi_result={'docs_found':myresults, 'type':'sentences'}
    js = json.dumps(cgi_result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp

@app.route('/getANNDocs', methods = ['POST'])
def retrieveNeighborsDocsId():
    data = request.json
    v = np.array(data["query"])
    #v = data["query"] 
    n = data["n"] if "n" in data else 3

    neighbors = engineDocs.neighbours(v)
    count = 0
    result = []
    for neighbor in neighbors:
        count = count + 1
        result.append(int(neighbor[1].split("_")[1]))
        if n==count:
            break
    
    myresults = list(colDocs.find({"docId":{"$in":result}},{"_id":0}))
    
    cgi_result={'docs_found':myresults,'type':'documents'}
    js = json.dumps(cgi_result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp

    
    
#connection to mongoDB for 
data = {}
port = data['port'] if 'port' in data else 27017
hostName = data['host'] if 'host' in data else 'localhost'
databaseName = data['database'].lower() if 'database' in data else 'fakeNews'
collectionName = data['collection'] if 'collection' in data else '2d'

collectionNameDocs = data['collection'] if 'collection' in data else '2ddocs'


#connect to database
try:
    client = pymongo.MongoClient(hostName,port)
except pymongo.errors.ConnectionFailure as e:
    cgi_result={'error':"Could not connect to server: %s" % e}
    js = json.dumps(cgi_result)
    resp = Response(js, status=200, mimetype='application/json')
    print(resp)
    
db = client[databaseName]
col = db[collectionName]
colDocs = db[collectionNameDocs]


my_file = Path(pickleFile)
if my_file.is_file():
    engine = pickle.load( open( pickleFile, "rb" ) )
            
my_fileDocs = Path(pickleFileDocs)
if my_fileDocs.is_file():
    engineDocs = pickle.load( open( pickleFileDocs, "rb" ) )

    print("Service ready" , file=sys.stderr)

#if __name__ == '__main__':
    #app.run(host='0.0.0.0')
    #app.run() 