#!/bin/bash
#
# Runs one CI shard of the e2e suite split across several separate wp-env
# test environments, each with its own WordPress and MySQL containers on its
# own port, so the shard runs that many tests at once instead of one.
#
# Usage, from the repository root:
#   test/e2e/wp-env-instances.sh <sites> <part> <total parts> [playwright args]

set -euo pipefail

sites=$1
part=$2
total=$3
shift 3

root=$( pwd )
work=${RUNNER_TEMP:-/tmp}/e2e-envs
rm -rf "$work"
mkdir -p "$work"

echo "::group::Start the environments"

# wp-env tells environments apart by the folder of their config file, so each
# site gets a folder with a copy of .wp-env.test.json, with local paths made
# absolute and its own port.
start_pids=()
for site in $( seq 1 "$sites" ); do
	dir="$work/env-$site"
	mkdir -p "$dir"
	node -e '
		const path = require( "path" );
		const [ root, port ] = process.argv.slice( 1 );
		const config = require( path.join( root, ".wp-env.test.json" ) );
		const local = ( source ) =>
			source.startsWith( "." ) ? path.resolve( root, source ) : source;
		config.port = Number( port );
		config.plugins = config.plugins.map( local );
		config.themes = config.themes.map( local );
		for ( const target of Object.keys( config.mappings ) ) {
			config.mappings[ target ] = local( config.mappings[ target ] );
		}
		delete config.$schema;
		console.log( JSON.stringify( config, null, "\t" ) );
	' "$root" $(( 8887 + site * 2 )) > "$dir/.wp-env.json"
	( cd "$dir" && "$root/node_modules/.bin/wp-env" start ) > "$work/start-$site.log" 2>&1 &
	start_pids+=( $! )
done

for site in $( seq 1 "$sites" ); do
	if ! wait "${start_pids[$(( site - 1 ))]}"; then
		cat "$work/start-$site.log"
		exit 1
	fi
	tail -3 "$work/start-$site.log"
done

echo "::endgroup::"

# Record CPU and memory use while the tests run.
nproc > "$work/usage.log"
vmstat -S M 30 >> "$work/usage.log" &
vmstat_pid=$!
# Every 30 seconds, CPU use by command over a 5 second window.
while true; do
	top -b -n 2 -d 5 -w 512 | awk '/^top -/ { n++ } n == 2 && $1 ~ /^[0-9]+$/ { cpu[ $12 ] += $9 } END { print "--"; for ( c in cpu ) print c, cpu[ c ] }' >> "$work/processes.log"
	sleep 25
done &
top_pid=$!

pids=()
for site in $( seq 1 "$sites" ); do
	shard=$(( ( part - 1 ) * sites + site ))
	(
		cd "$root/test/e2e"
		WP_BASE_URL="http://localhost:$(( 8887 + site * 2 ))" \
		WP_ARTIFACTS_PATH="$root/test/e2e/artifacts/site-$site" \
		PLAYWRIGHT_BLOB_OUTPUT_FILE="$root/test/e2e/blob-report/report-$shard.zip" \
			xvfb-run --server-num=$(( 98 + site )) --server-args="-screen 0 1280x960x24" -- \
			npx playwright test --config playwright.config.ts --shard="$shard/$(( total * sites ))" "$@"
	) > "$work/tests-$site.log" 2>&1 &
	pids+=( $! )
done

status=0
for site in $( seq 1 "$sites" ); do
	wait "${pids[$(( site - 1 ))]}" || status=1
	echo "::group::Site $site"
	cat "$work/tests-$site.log"
	echo "::endgroup::"
done

kill "$vmstat_pid" "$top_pid"
echo "::group::CPU and memory"
cat "$work/usage.log"
echo "::endgroup::"
echo "::group::Average CPU by command (100 = one core)"
awk '$1 == "--" { samples++; next } { sum[ $1 ] += $2 } END { for ( c in sum ) printf "%6.0f %s\n", sum[ c ] / samples, c }' "$work/processes.log" | sort -rn | head -20
echo "::endgroup::"

exit $status
