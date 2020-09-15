import pymongo

import sys
import numpy as np
from nearpy import Engine
from nearpy.hashes import RandomBinaryProjections

import pickle
from pathlib import Path




pickleFile = "./engine.p"
pickleFileDocs = "./engineDocs.p"


def indexEverything():
    # ANN init scripts
    # Dimension of our vector space
    dimension = 200

    # Create a random binary hash with 10 bits
    rbp = RandomBinaryProjections('rbp', 10)

    # Create engine with pipeline configuration
    engine = Engine(dimension, lshashes=[rbp])

    #extract ids from the 500k sentences
    with open('../data/redU500k50p.ssv','r') as redFile:
        count = 0
        index = []
        for line in redFile:
            index.append(int(float(line.rstrip().split(' ')[0])))

    # Index vectors (set their data to a unique string)
    with open('../data/origdimU.ssv','r') as origDim:
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

    pickle.dump( engine, open( pickleFile, "wb" ) )
    return engine
    
def indexEverythingDocs():
    # ANN init scripts
    # Dimension of our vector space
    dimension = 616

    # Create a random binary hash with 10 bits
    rbp = RandomBinaryProjections('rbp', 10)

    # Create engine with pipeline configuration
    engine = Engine(dimension, lshashes=[rbp])

    

    # Index vectors (set their data to a unique string)
    with open('../data/impx.tsv','r') as origDim:
        count = 0 
        
        for line in origDim:
            if (count >0):
                
                lst = line.rstrip().split('\t')
                #del lst[-2:]
                lst = list(map(float,lst))
                v = np.array(lst)

                engine.store_vector(v, 'data_%d' % count)
            count = count + 1
            if ((count % 10000) ==0):
                print(count, file=sys.stderr)

    pickle.dump( engine, open( pickleFileDocs, "wb" ) )
    return engine

my_file = Path(pickleFile)
if my_file.is_file():
    pass
else:
    engine = indexEverything()

print("Sentences indexed")
my_fileDocs = Path(pickleFileDocs)
if my_fileDocs.is_file():
    pass
else:
    engineDocs = indexEverythingDocs()
            
print("Docs indexed")
