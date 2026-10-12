"""Temporary diagnostics: one line per synthesized tap from the simulator's
touch log (backboardd, TouchEvents), saying whether the tap was lost."""
import re
import sys
from datetime import datetime

taps = []
for line in open(sys.argv[1], errors="replace"):
    match = re.match(r"(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d+)", line)
    if not match:
        continue
    time = datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S.%f")
    if "digitizer attached" in line:
        taps.append({"time": time, "unknown": 0, "skipped": 0, "lost": False})
    elif not taps:
        continue
    elif "unknown digitizer" in line:
        taps[-1]["unknown"] += 1
    elif "skipping event" in line:
        taps[-1]["skipped"] += 1
    elif "canceling paths contacts" in line and "touching" in line:
        taps[-1]["lost"] = True

previous = None
for number, tap in enumerate(taps, 1):
    gap = (tap["time"] - previous).total_seconds() if previous else 0
    previous = tap["time"]
    print(
        "TAP %3d %s gap=%6.1fs unknown=%d skipped=%d %s"
        % (number, tap["time"].strftime("%H:%M:%S.%f")[:-3], gap, tap["unknown"], tap["skipped"], "LOST" if tap["lost"] else "ok")
    )
lost = [tap for tap in taps if tap["lost"]]
print("TAPS %d LOST %d RACED %d" % (len(taps), len(lost), sum(1 for tap in taps if tap["unknown"])))
