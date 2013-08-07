# Generates u-urlencoded.txt from utf-8.txt
#
# u-urlencoded.txt is used by Tests_Formatting_UrlEncodedToEntities

import codecs
import sys

def uurlencode(line):
    """Use %u[hexvalue] percent encoding."""
    line = line.strip()
    line = ["%%u%04X" % ord(s) for s in line]
    return "".join(line)

if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] in ("-h", "--help"):
        print "Usage: python u-urlencode.py < utf-8.txt > u-urlencoded.txt"
        sys.exit(2)

    sys.stdin = codecs.getreader("utf-8")(sys.stdin)
    sys.stdout = codecs.getwriter("ascii")(sys.stdout)    
    
    lines = sys.stdin.readlines()
    sys.stdout.write( "\n".join(map(uurlencode, lines)) )
