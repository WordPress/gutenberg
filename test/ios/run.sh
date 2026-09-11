#!/usr/bin/env bash
# Runs the Safari tests against the plugin in this checkout on an iOS
# simulator. Needs macOS with Xcode, xcodegen, the Node version in
# .nvmrc and a built plugin (npm run build). Set WP_PORT to serve
# WordPress on another port and SIMULATOR_UDID to pick a device.
set -euo pipefail

# Steps print like the performance tests: elapsed time, then the step.
step() {
	printf '\n[%02d:%02d] ▶ %s\n' $(( SECONDS / 60 )) $(( SECONDS % 60 )) "$*"
}

cd "$( dirname "$0" )/../.."

PORT="${WP_PORT:-9400}"
export WP_BASE_URL="http://127.0.0.1:${PORT}"

# A booted iPhone if there is one, otherwise an iPhone on the newest iOS.
UDID="${SIMULATOR_UDID:-$( xcrun simctl list devices available -j | python3 -c '
import json, re, sys
runtimes = json.load( sys.stdin )[ "devices" ]
# Runtime identifiers end in the version, like SimRuntime.iOS-26-2.
def version( runtime ):
	return [ int( part ) for part in re.findall( r"\d+", runtime.split( ".iOS-" )[ -1 ] ) ]
phones = [
	device
	for runtime in sorted( ( r for r in runtimes if ".iOS-" in r ), key=version )
	for device in runtimes[ runtime ] if device[ "name" ].startswith( "iPhone" )
]
booted = [ device for device in phones if device[ "state" ] == "Booted" ]
devices = booted or phones
if not devices:
	sys.exit( "No available iPhone simulator" )
print( devices[ -1 ][ "udid" ] )
' )}"
[ -n "$UDID" ] || exit 1
step "Booting simulator $UDID"
# The boot goes on in the background while WordPress starts.
xcrun simctl boot "$UDID" 2>/dev/null || true
# WordPress runs in Playground: PHP compiled to WebAssembly, no Docker.
step "Starting WordPress"
PLAYGROUND_LOG=$( mktemp )
npx --yes @wp-playground/cli@3.1.53 server \
	--auto-mount="$PWD" \
	--blueprint=test/ios/blueprint.json \
	--port "$PORT" > "$PLAYGROUND_LOG" 2>&1 &
PLAYGROUND_PID=$!
trap 'kill "$PLAYGROUND_PID" 2>/dev/null || true' EXIT
# Playground prints "Ready!" once it listens and the blueprint has run; the
# server answers earlier, before the plugin is active.
until grep -q "Ready!" "$PLAYGROUND_LOG"; do
	kill -0 "$PLAYGROUND_PID" 2>/dev/null || { cat "$PLAYGROUND_LOG"; echo "WordPress did not start"; exit 1; }
	sleep 1
done
cat "$PLAYGROUND_LOG"

# Warm up: the first request to the editor does the one-time work of a
# fresh site, which would otherwise count against the test's timeout. It
# also shows whether the plugin replaces core's bundles, which it only
# does when its build exists.
step "Loading the editor once"
# Playground logs the request in through a redirect, so cookies must be
# kept between the hops: -b "" holds them in memory.
if ! EDITOR_HTML=$( curl -sSL --fail -b "" "$WP_BASE_URL/wp-admin/post-new.php" ); then
	echo "The editor did not load from $WP_BASE_URL"
	exit 1
fi
if ! grep -q "/build/scripts/rich-text/" <<< "$EDITOR_HTML"; then
	echo "The editor loaded without this checkout's build. Run npm run build first."
	exit 1
fi

step "Waiting for the simulator"
xcrun simctl bootstatus "$UDID" -b
# Playground logs a browser in once and remembers that in a cookie, which
# outlives the server: start Safari without cookies from an earlier run.
xcrun simctl terminate "$UDID" com.apple.mobilesafari 2>/dev/null || true
SAFARI_DATA=$( xcrun simctl get_app_container "$UDID" com.apple.mobilesafari data )
if [[ -n "$SAFARI_DATA" && -d "$SAFARI_DATA" ]]; then
	rm -f "$SAFARI_DATA"/Library/Cookies/*.binarycookies
fi

step "Generating the Xcode project"
( cd test/ios && xcodegen generate --quiet )
step "Building and running the tests"
rm -rf test/ios/build/results.xcresult
TEST_RUNNER_WP_BASE_URL="$WP_BASE_URL" xcodebuild test \
	-project test/ios/GutenbergIOS.xcodeproj \
	-scheme SafariTests \
	-destination "id=${UDID}" \
	-derivedDataPath test/ios/build \
	-resultBundlePath test/ios/build/results.xcresult \
	"$@"
