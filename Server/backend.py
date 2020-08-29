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
    
    cgi_result={'docs_found':myresults}
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
    
    cgi_result={'docs_found':myresults}
    js = json.dumps(cgi_result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp

#connection to mongoDB for 
data = {}
port = data['port'] if 'port' in data else 27017
hostName = data['host'] if 'host' in data else 'localhost'
databaseName = data['database'].lower() if 'database' in data else 'fakeNews'
collectionName = data['collection'] if 'collection' in data else '2d'


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

def indexEverything():
    # ANN init scripts
    # Dimension of our vector space
    dimension = 200

    # Create a random binary hash with 10 bits
    rbp = RandomBinaryProjections('rbp', 10)

    # Create engine with pipeline configuration
    engine = Engine(dimension, lshashes=[rbp])

    #extract ids from the 500k sentences
    with open('../data/red500k50p.ssv','r') as redFile:
        count = 0
        index = []
        for line in redFile:
            index.append(int(float(line.rstrip().split(' ')[0])))

    # Index vectors (set their data to a unique string)
    with open('../data/origdim.ssv','r') as origDim:
        count = 0 
        added = 0
        for line in origDim:
            if count in index:
                added = added + 1
                lst = line.rstrip().split(' ')
                del lst[-2:]
                lst = list(map(float,lst))
                v = np.array(lst)

                engine.store_vector(v, 'data_%d' % count)
            count = count +1
            if ((count % 10000) ==0):
                print(count, file=sys.stderr)

    pickle.dump( engine, open( "./engine.p", "wb" ) )
    return engine

my_file = Path(pickleFile)
if my_file.is_file():
    engine = pickle.load( open( pickleFile, "rb" ) )
else:
    engine = indexEverything()
            
print("Service ready" , file=sys.stderr)
#if __name__ == '__main__':
    #app.run(host='0.0.0.0')
    #app.run() 