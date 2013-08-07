# Generates entitized.txt from utf-8.txt
#
# entitized.txt is used by Tests_Formatting_UrlEncodedToEntities

import codecs
import sys

def entitize(line):
    """Convert text to &#[dec]; entities."""
    line = line.strip();
    line = ["&#%d;" % ord(s) for s in line]
    return "".join(line)

if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] in ("-h", "--help"):
        print "Usage: python entitize.py < utf-8.txt > entitized.txt"
        sys.exit(2)

    sys.stdin = codecs.getreader("utf-8")(sys.stdin)
    sys.stdout = codecs.getwriter("ascii")(sys.stdout)    
    
    lines = sys.stdin.readlines()
    sys.stdout.write( "\n".join(map(entitize, lines)) )
