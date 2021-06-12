1)Create a screen: screen -S backend
2)Activate the environment: conda activate credibilatorP3
3)navigate to the server folder: cd ./credibilator/Server
4) Run flask

export FLASK_APP=backend.py
flask run --host=0.0.0.0 --port=5001

The packages of the environment credibilatorP3 can be found in credibilatorenv.txt