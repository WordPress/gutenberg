#!/bin/bash
#
# Starts several separate wp-env test environments, each with its own
# WordPress and MySQL containers on its own port, and prints their addresses
# as a comma-separated list for WP_BASE_URLS. Playwright then runs one worker
# per environment.
#
# Usage, from the repository root:
#   test/e2e/wp-env-instances.sh [sites]

set -euo pipefail

# One site per two cores: on four cores, two sites were as fast as three.
sites=${1:-$(( $( nproc ) / 2 ))}
if (( sites < 1 )); then
	sites=1
fi

root=$( pwd )
work=${RUNNER_TEMP:-/tmp}/e2e-envs
rm -rf "$work"
mkdir -p "$work"

# wp-env tells environments apart by the folder of their config file, so each
# site gets a folder with a copy of .wp-env.test.json, with local paths made
# absolute and its own port.
pids=()
urls=()
for site in $( seq 1 "$sites" ); do
	dir="$work/env-$site"
	port=$(( 8887 + site * 2 ))
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
	' "$root" "$port" > "$dir/.wp-env.json"
	( cd "$dir" && "$root/node_modules/.bin/wp-env" start ) > "$work/start-$site.log" 2>&1 &
	pids+=( $! )
	urls+=( "http://localhost:$port" )
done

for site in $( seq 1 "$sites" ); do
	if ! wait "${pids[$(( site - 1 ))]}"; then
		cat "$work/start-$site.log" >&2
		exit 1
	fi
done

( IFS=,; echo "${urls[*]}" )
