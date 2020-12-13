import os
import sys
import json
import subprocess
from typing import Dict
# Hacky workaround to fetch an external dependency
try:
    import requests
except ModuleNotFoundError:
    subprocess.Popen(["python", "-m", "pip", "install", "-U", 'requests']).wait()
    import requests

def extract_info(filepath: str) -> Dict:
    with open(file=filepath, mode='r', encoding='utf_8') as export:
        songlist = json.load(export)
        #print(songlist)
    return songlist
