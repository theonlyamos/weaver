import socketio
from time import sleep
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
    global sio
    sio.connect('http://localhost:5000/')
    while True:
        pass

if __name__ == '__main__':
    try:
        thread = Thread(target=ConnectWebsocket)
        thread.daemon = True
        thread.start()
        thread.join()
    except ConnectionError:
        sleep(5)
        pass
    except KeyboardInterrupt:
        sio.disconnect()
    except Exception as e:
        print(str(e))
