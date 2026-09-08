#!/usr/bin/env bash
# Runs the Safari tests against the plugin in this checkout on an iOS
# simulator. Needs macOS with Xcode, xcodegen and a built plugin
# (npm run build). Set WP_PORT to serve WordPress on another port,
# SIMULATOR_DEVICE to pick a device family and SIMULATOR_UDID to pick one
# device. Arguments are passed on to xcodebuild, e.g.
# -only-testing:SafariTests/CaretPlacementTests.
set -euo pipefail

# Steps print like the performance tests: elapsed time, then the step.
step() {
	printf '\n[%02d:%02d] ▶ %s\n' $(( SECONDS / 60 )) $(( SECONDS % 60 )) "$*"
}

cd "$( dirname "$0" )/../.."

PORT="${WP_PORT:-9400}"
export WP_BASE_URL="http://127.0.0.1:${PORT}"

# An iPhone unless asked otherwise. The editor lays out by viewport width,
# so an iPad gets the desktop editor a tablet user sees and an iPhone the
# mobile one.
export SIMULATOR_DEVICE="${SIMULATOR_DEVICE:-iPhone}"

# A booted matching device if there is one, otherwise any available one.
UDID="${SIMULATOR_UDID:-$( xcrun simctl list devices available -j | python3 -c '
import json, os, sys
wanted = os.environ[ "SIMULATOR_DEVICE" ]
runtimes = json.load( sys.stdin )[ "devices" ]
devices = [
	device
	for runtime, available in runtimes.items() if ".iOS-" in runtime
	for device in available if device[ "name" ].startswith( wanted )
]
if not devices:
	sys.exit( "No available %s simulator" % wanted )
booted = [ device for device in devices if device[ "state" ] == "Booted" ]
print( ( booted or devices )[ -1 ][ "udid" ] )
' )}"
step "Booting simulator $UDID"
# The boot goes on in the background while WordPress starts.
# The software keyboard only shows without a hardware keyboard.
defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false
xcrun simctl boot "$UDID" 2>/dev/null || true
# WordPress runs in Playground: PHP compiled to WebAssembly, no Docker.
start_wordpress() {
	PLAYGROUND_LOG=$( mktemp )
	# Playground defaults to min( 6, cpus - 1 ) workers and warns that fewer
	# than six make a deadlock on its file locks more likely. Runners have
	# three cores, so it would pick two and has been seen to stop answering
	# for minutes at a time.
	npx --yes @wp-playground/cli@3.1.53 server \
		--auto-mount="$PWD" \
		--blueprint=test/ios/blueprint.json \
		--workers "${PLAYGROUND_WORKERS:-6}" \
		--port "$PORT" > "$PLAYGROUND_LOG" 2>&1 &
	PLAYGROUND_PID=$!
	# Playground prints "Ready!" once it listens and the blueprint has run;
	# the server answers earlier, before the plugin is active.
	until grep -q "Ready!" "$PLAYGROUND_LOG"; do
		kill -0 "$PLAYGROUND_PID" 2>/dev/null || return 1
		sleep 1
	done
}

step "Starting WordPress"
trap 'kill "$PLAYGROUND_PID" 2>/dev/null || true' EXIT
# npx fetches the server on first use, and the registry has reset the
# connection on a runner before, which is worth another go rather than a
# failed run.
for TRY in 1 2 3; do
	start_wordpress && break
	cat "$PLAYGROUND_LOG"
	if [ "$TRY" = 3 ]; then
		echo "WordPress did not start"
		exit 1
	fi
	echo "WordPress did not start, trying again"
	sleep 5
done
cat "$PLAYGROUND_LOG"

# Warm up: the first request to the editor does the one-time work of a
# fresh site, which would otherwise count against the test's timeout. It
# also shows whether the plugin replaces core's bundles, which it only
# does when its build exists.
step "Loading the editor once"
# Playground logs a browser in once, through a redirect, and remembers it in
# a cookie. The hops within one request need the cookie, and so does every
# request after the one that logged in, so they share a jar.
COOKIES=$( mktemp )
warm() {
	# --keep-session-cookies: the login cookie has no expiry, and curl drops
	# those from the jar without it, so only the first request was logged in.
	curl -sL -c "$COOKIES" -b "$COOKIES" --keep-session-cookies \
		--max-time 300 "$WP_BASE_URL/$1"
}
EDITOR_HTML=$( warm "wp-admin/post-new.php" )
if ! grep -q "/build/scripts/rich-text/" <<< "$EDITOR_HTML"; then
	echo "The editor does not load this checkout's build. Run npm run build first."
	exit 1
fi

# The pages the tests open, warmed here as well, so that the one-time work
# of a fresh site does not count against a test's timeout. Not fatal: the
# tests open these pages again and ask a second time if they do not come up,
# and a warm-up that failed is not reason enough to give up the whole run.
for POST in $( grep -o "42424[0-9]" test/ios/blueprint.json | sort -u ); do
	if ! warm "wp-admin/post.php?post=${POST}&action=edit" | grep -q "wp:paragraph"; then
		echo "Warning: the editor did not serve seeded post ${POST}."
	fi
done

step "Waiting for the simulator"
xcrun simctl bootstatus "$UDID" -b
# Playground logs a browser in once and remembers that in a cookie, which
# outlives the server: start Safari without cookies from an earlier run.
xcrun simctl terminate "$UDID" com.apple.mobilesafari 2>/dev/null || true
SAFARI_DATA=$( xcrun simctl get_app_container "$UDID" com.apple.mobilesafari data )
rm -f "$SAFARI_DATA"/Library/Cookies/*.binarycookies

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
