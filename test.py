import socketio
from threading import Thread

sio = socketio.Client()

@sio.event
def connect():
    print("[LOG] Connected to server")

@sio.event
def connect_error():
    print('[WARNING] Error Connecting to server')

@sio.event
def disconnect():
    print('[LOG] Disconnected from server')

@sio.event
def message(ms):
    print(msg)

def ConnectWebsocket():
    sio.connect('http://localhost:5000/')

thread = Thread(target=ConnectWebsocket)
thread.daemon = True
thread.start()
