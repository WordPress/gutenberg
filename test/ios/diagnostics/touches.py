"""Temporary diagnostics: one line per synthesized tap from the simulator's
touch log, with whether it was lost and how idle the CPU was around it."""
import re
import sys
from datetime import datetime, timedelta

taps = []
for line in open(sys.argv[1], errors="replace"):
    match = re.match(r"(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d+)", line)
    if not match:
        continue
    time = datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S.%f")
    if "digitizer attached" in line:
        taps.append({"time": time, "unknown": 0, "lost": False})
    elif not taps:
        continue
    elif "unknown digitizer" in line:
        taps[-1]["unknown"] += 1
    elif "canceling paths contacts" in line and "touching" in line:
        taps[-1]["lost"] = True

# top -l samples: a timestamp line, a CPU usage line and the busiest processes.
samples = []
for line in open(sys.argv[2], errors="replace"):
    match = re.match(r"(\d{4}/\d\d/\d\d \d\d:\d\d:\d\d)", line)
    if match:
        samples.append({"time": datetime.strptime(match.group(1), "%Y/%m/%d %H:%M:%S"), "idle": None, "top": []})
        continue
    if not samples:
        continue
    match = re.search(r"CPU usage: .*?([\d.]+)% idle", line)
    if match:
        samples[-1]["idle"] = float(match.group(1))
        continue
    match = re.match(r"\s*(\S.*?)\s+([\d.]+)\s*$", line)
    if match and match.group(1) not in ("COMMAND",) and samples[-1]["idle"] is not None and len(samples[-1]["top"]) < 3:
        samples[-1]["top"].append("%s %s" % (match.group(1)[:16], match.group(2)))


def around(time):
    near = [s for s in samples if s["idle"] is not None and abs((s["time"] - time).total_seconds()) <= 3]
    if not near:
        return None, ""
    busiest = min(near, key=lambda s: s["idle"])
    return busiest["idle"], ", ".join(busiest["top"])


previous = None
ok_idle, lost_idle = [], []
for number, tap in enumerate(taps, 1):
    gap = (tap["time"] - previous).total_seconds() if previous else 0
    previous = tap["time"]
    idle, top = around(tap["time"])
    if idle is not None:
        (lost_idle if tap["lost"] else ok_idle).append(idle)
    if tap["lost"] or tap["unknown"] or gap > 10:
        print(
            "TAP %3d %s gap=%6.1fs raced=%d idle=%s %s %s"
            % (number, tap["time"].strftime("%H:%M:%S.%f")[:-3], gap, tap["unknown"],
               "%5.1f%%" % idle if idle is not None else "  ?  ", "LOST" if tap["lost"] else "ok  ", top)
        )


def summary(values):
    if not values:
        return "none"
    values = sorted(values)
    return "n=%d min=%.0f%% median=%.0f%% max=%.0f%%" % (len(values), values[0], values[len(values) // 2], values[-1])


print("TAPS %d LOST %d RACED %d" % (len(taps), sum(t["lost"] for t in taps), sum(1 for t in taps if t["unknown"])))
print("CPU idle around landed taps: " + summary(ok_idle))
print("CPU idle around lost taps:   " + summary(lost_idle))
