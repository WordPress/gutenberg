#!/usr/bin/env bash
# Runs the Safari tests against the plugin in this checkout on an iOS
# simulator. Needs macOS with Xcode, xcodegen and a built plugin
# (npm run build). Set WP_PORT to serve WordPress on another port.
set -euo pipefail

cd "$( dirname "$0" )/../.."

PORT="${WP_PORT:-9400}"
export WP_BASE_URL="http://127.0.0.1:${PORT}"

# WordPress runs in Playground: PHP compiled to WebAssembly, no Docker.
npx --yes @wp-playground/cli@3.1.53 server \
	--auto-mount="$PWD" \
	--blueprint=test/ios/blueprint.json \
	--port "$PORT" &
PLAYGROUND_PID=$!
trap 'kill "$PLAYGROUND_PID" 2>/dev/null || true' EXIT

for _ in $( seq 1 180 ); do
	if curl -sf -o /dev/null "$WP_BASE_URL/"; then
		break
	fi
	sleep 1
done
curl -sf -o /dev/null "$WP_BASE_URL/" || { echo "WordPress did not start"; exit 1; }

# A booted iPhone if there is one, otherwise any available iPhone.
UDID=$( xcrun simctl list devices available -j | python3 -c '
import json, sys
runtimes = json.load( sys.stdin )[ "devices" ]
phones = [
	device
	for runtime, devices in runtimes.items() if ".iOS-" in runtime
	for device in devices if device[ "name" ].startswith( "iPhone" )
]
booted = [ device for device in phones if device[ "state" ] == "Booted" ]
print( ( booted or phones )[ -1 ][ "udid" ] )
' )
# The software keyboard only shows without a hardware keyboard.
defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b
# Playground logs a browser in once and remembers that in a cookie, which
# outlives the server: start Safari without cookies from an earlier run.
xcrun simctl terminate "$UDID" com.apple.mobilesafari 2>/dev/null || true
SAFARI_DATA=$( xcrun simctl get_app_container "$UDID" com.apple.mobilesafari data )
rm -f "$SAFARI_DATA"/Library/Cookies/*.binarycookies

( cd test/ios && xcodegen generate --quiet )
rm -rf test/ios/build/results.xcresult
TEST_RUNNER_WP_BASE_URL="$WP_BASE_URL" xcodebuild test \
	-project test/ios/GutenbergIOS.xcodeproj \
	-scheme SafariTests \
	-destination "id=${UDID}" \
	-derivedDataPath test/ios/build \
	-resultBundlePath test/ios/build/results.xcresult \
	"$@"
