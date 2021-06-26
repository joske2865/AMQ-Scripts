import os
import sys
import json
import subprocess
from typing import List
from pathlib import Path
# Hacky workaround to fetch an external dependency
try:
    import requests
except ModuleNotFoundError:
    subprocess.Popen(["python", "-m", "pip", "install", "-U", 'requests']).wait()
    import requests
try:
    import eyed3
except ModuleNotFoundError:
    subprocess.Popen(["python", "-m", "pip", "install", "-U", 'eyed3']).wait()
    import eyed3

"""
Function that loads an export.json and returns the songlist.
Also selects the keys to be used, unless given.

:param filepath: str:   A filepath to find the export.json.
                        It's expected to be given as an argument for the script.
:param lang: str:       The title language to extract and work with.
:return: List:          A List of dicts with only the info required for
                        learning songs and becoming a massive booli.
"""
def extract_info(filepath: str, lang: str='romaji') -> List:
    songs = []
    with open(file=filepath, mode='r', encoding='utf_8') as export:
        songlist = json.load(export)
    for song in songlist:
        name = song['name'].replace('/', '_').replace('\\', '_')
        artist = song['artist'].replace('/', '_').replace('\\', '_')
        anime = song['anime'][lang].replace('/', '_').replace('\\', '_') if song['anime'][lang] else song['anime'][song['anime'].keys()[0]].replace('/', '_').replace('\\', '_')
        stype = song['type']
        # If there is no mp3, we print some data and skip this song.
        if '0' not in song['urls']['catbox']:
            print(f"No mp3 available for {artist} - {name} ({anime} {stype}).\nThe available links for this are: {song['urls']}")
            continue
        mp3 = song['urls']['catbox']['0']
        s = {'title': name, 'artist': artist, 'anime': anime, 'type': stype, 'url': mp3}
        songs.append(s)
    return songs

"""
Downloads a file to wherever it needs to go.

:param url: str:                URL where the file may be found
:param filename: str:           Filename (with or without path) to save to.
:param force_replace: bool:     Whether or not to replace existing files.
                                Defaults to FALSE.
:return: bool:                  True on success, raises something otherwise.
                                Imagine handling errors.
"""
def download(url: str, filename: str, force_replace: bool=False) -> bool:
    if(Path(filename).exists() and not force_replace):
        # We already have this, no need to download it again.
        if verbose:
            print(f"The song at '{url}' was already downloaded!")
        return
    stream = requests.get(url, stream=True)
    with open(filename, "wb") as file:
        for chunk in stream.iter_content(chunk_size=320):
            file.write(chunk)
    return True

illegals = ['<', '>', ':', '"', '|', '?', '*']
# Set some sane default values
replace = False
lang = 'romaji'
path = './'
infile = "./export.json"
verbose = False
# Use some butcher-style argument parsing. sys.argv[0] is this script, ignore that
args = sys.argv[1:]
if 'help' in args:
    print("Welcome to the localExportDownloader utility which downloads all files from your export.json, given they weren't downloaded already.")
    print("It seems your args included the keyword 'help', which summons this message and halts the program. If you believe this to be a bug, fix the source and move on.")
    print("Argument options are requested in the form of 'keyword=value'. The available keywords are:")
    print("\tverbose:\t\tWhether or not to print verbose output.\n\tpath:\t\tThe output path for downloading files\n\tlang:\t\tEither 'english' or 'romaji'. Anything else will crash.\n\treplace:\t\tWhether to force replacement of existing files, defaults to False.\n\tinfile: The most important one here! The export.json or whatever it is you named it.\n\t\t\t\tIf this is missing and the current directory doesn't have an export.json, shit WILL hit the fan!")
    print("Please do not add illegal chars to the path names, that way I can make sure the filenames are clean. Illegal chars get replaced with '_'")
    print("I'll make sure to strip off all single and double quotes for your convenience. I'll also make sure all paths end with a '/' in case you forget.")
    print("Please tell me you didn't name a file or folder 'help', or you'd be a big baka!")
    exit(0)
for arg in args:
    kw,a = arg.split('=')
    # Split off any and all quotes, we don't need them here.
    kw = kw.replace('"', '').replace("'", "")
    a = a.replace('"', '').replace("'", "")
    path = a if kw == 'path' else path
    lang = a.lower() if kw == 'lang' else lang
    replace = True if kw == 'replace' and a.lower() == "true" else replace
    infile = a if kw == 'infile' else infile
    verbose = True if kw == "verbose" and a.lower() == "true" else False
if not path.endswith('/'):
    path += "/"
# Create the path if it's not there yet
Path(path).mkdir(parents=True, exist_ok=True)
for song in extract_info(filepath=infile, lang=lang):
    outfile = f"{path}{song['anime']}-{song['type']} - {song['artist']}-{song['title']}.mp3"
    for i in illegals:
        outfile = outfile.replace(i, "_")
    print(outfile)
    download(url=song['url'], filename=outfile, force_replace=replace)
    id3file = eyed3.load(outfile)
    if not id3file.tag:
        id3file.initTag()
    id3file.tag.clear()
    id3file.tag.artist = song['artist']
    id3file.tag.title = song['title']
    id3file.tag.comment = song['type']
    id3file.tag.album = song['anime']
    id3file.tag.save()
    if verbose:
        print(f"\t- Downloaded {song['anime']} {song['type']} and saved to {outfile}")
print("That should be all of the songs unless some weren't uploaded as mp3. Cya!")
