#! /usr/bin/python3

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, send, leave_room, join_room
from threading import Thread

app = Flask(__name__)
app.secret_key = "8sa0fdsuo43fdjiofs90dfasdfa0"
sio = SocketIO(app)

WS_CONNECTIONS = []


@app.route('/')
def index():
    return render_template('home.html')

@sio.on('connect')
def connect_web():
    global WS_CONNECTIONS
    
    WS_CONNECTIONS.append(request.sid)

@sio.on('message')
def send_message(msg):
	send(msg, broadcast=True)

@sio.on('disconnect')
def on_disconnect():
    del WS_CONNECTIONS[WS_CONNECTIONS.index(request.sid)]
    
if __name__ == '__main__':
    #app.run(debug=True, host="127.0.0.1")
	print('[INFO] Starting server at http://localhost:5000')
	sio.run(app)
