#!/usr/bin/env bash
# Temporary diagnostics: after the given seconds, samples the server's
# workers and prints the native frames of the one running PHP code.
SERVER=$1
sleep "$2"
OUT=$( mktemp -d )
SAMPLES=""
for PID in $( pgrep -P "$SERVER" ); do
	sample "$PID" 2 -file "$OUT/sample-$PID.txt" > /dev/null 2>&1 &
	SAMPLES="$SAMPLES $!"
done
wait $SAMPLES
for FILE in "$OUT"/sample-*.txt; do
	grep -q execute_ex "$FILE" || continue
	echo "  $( basename "$FILE" .txt ) after $2s, most sampled native frames:"
	awk '/Sort by top of stack/{f=1;next} /Binary Images/{f=0} f&&NF' "$FILE" | grep -v __workq_kernreturn | head -8 | sed 's/^ */    /'
	echo "  call graph:"
	awk '/Call graph:/{f=1;next} /Total number in stack/{f=0} f' "$FILE" | grep -E "execute_ex|zif_|php_|sqlite3|pdo_|curl|read|write|open|stat|lock|poll|select|sleep|wait" | grep -v "execute_ex" | head -15 | sed 's/^/    /'
done
