# Generates test data for functions converting between
# dodgy windows-1252-only values and their unicode counterparts

unichars = ["201A", "0192", "201E", "2026", "2020", "2021", 
            "02C6", "2030", "0160", "2039", "0152", "2018", 
            "2019", "201C", "201D", "2022", "2013", "2014", 
            "02DC", "2122", "0161", "203A", "0153", "0178"];

winpoints = []
unipoints = []

for char in unichars:
    char = unichr(int(char, 16))
    dec = ord(char)
    win = ord(char.encode("windows-1252"))
    
    unipoints.append(dec)
    winpoints.append(win)

def entitize(s):
    return "&#%s;" % s

winpoints = map(entitize, winpoints)
unipoints = map(entitize, unipoints)

print "".join(winpoints), "".join(unipoints)
    
