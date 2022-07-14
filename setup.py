from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need
# fine tuning.
build_options = {'packages': ['pynput'], 'excludes': ['tkinter']}

base = 'Console'

executables = [
    Executable('client.py', base=base)
]

setup(name='Weaver',
      version = '1.0',
      description = 'no description',
      options = {'build_exe': build_options},
      executables = executables)
