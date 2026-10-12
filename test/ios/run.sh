#!/usr/bin/env bash
# Runs the Safari tests against the plugin in this checkout on an iOS
# simulator. Needs macOS with Xcode, xcodegen, PHP with SQLite and a
# built plugin (npm run build). Set WP_PORT to serve WordPress on
# another port and SIMULATOR_UDID to pick a device.
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
# WordPress runs on PHP's built-in server with SQLite, set up fresh on
# every run, with the same steps as Playground's blueprint.json.
step "Starting WordPress"
ROOT="$PWD"
CACHE="$ROOT/test/ios/build/cache"
WP_DIR="$ROOT/test/ios/build/wordpress"
mkdir -p "$CACHE"
step "Downloading WP-CLI and SQLite"
[ -f "$CACHE/wp-cli.phar" ] || curl -sSLf -o "$CACHE/wp-cli.phar" https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
[ -f "$CACHE/sqlite.zip" ] || curl -sSLf -o "$CACHE/sqlite.zip" https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip
wp() { php -d memory_limit=512M "$CACHE/wp-cli.phar" --path="$WP_DIR" --quiet "$@"; }
rm -rf "$WP_DIR"
# The same WordPress as the end-to-end tests: a GitHub repository, with
# an optional #branch, from .wp-env.test.json.
CORE=$( python3 -c 'import json; print( json.load( open( ".wp-env.test.json" ) )[ "core" ] )' )
[[ "$CORE" =~ ^[^/#]+/[^/#]+(#.+)?$ ]] || { echo "Unsupported core in .wp-env.test.json: $CORE"; exit 1; }
REPO="${CORE%%#*}"
REF="HEAD"
[[ "$CORE" == *#* ]] && REF="${CORE#*#}"
step "Downloading WordPress from $REPO"
mkdir -p "$WP_DIR"
curl -sSLf "https://codeload.github.com/$REPO/tar.gz/$REF" | tar xz --strip-components=1 -C "$WP_DIR"
unzip -q "$CACHE/sqlite.zip" -d "$WP_DIR/wp-content/plugins"
SQLITE="$WP_DIR/wp-content/plugins/sqlite-database-integration"
sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$SQLITE#" -e "s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" \
	"$SQLITE/db.copy" > "$WP_DIR/wp-content/db.php"
step "Installing WordPress"
wp config create --dbname=wordpress --dbuser=wordpress --dbpass=wordpress --skip-check
wp core install --url="$WP_BASE_URL" --title="iOS tests" --admin_user=admin --admin_password=password --admin_email=admin@example.com --skip-email
step "Activating the plugin"
ln -s "$ROOT" "$WP_DIR/wp-content/plugins/gutenberg"
wp plugin activate gutenberg
python3 "$ROOT/test/ios/blueprint-steps.py" "$ROOT/test/ios/blueprint.json" "$WP_DIR"
# Like Playground's login option: every request is the administrator's.
cat > "$WP_DIR/wp-content/mu-plugins/login.php" <<'PHP'
<?php
add_action( 'init', function () {
	if ( is_user_logged_in() ) {
		return;
	}
	// The admin checks this request's cookies, so set them here too.
	$expiration = time() + DAY_IN_SECONDS;
	$_COOKIE[ AUTH_COOKIE ] = wp_generate_auth_cookie( 1, $expiration, 'auth' );
	$_COOKIE[ LOGGED_IN_COOKIE ] = wp_generate_auth_cookie( 1, $expiration, 'logged_in' );
	wp_set_auth_cookie( 1, true );
	wp_set_current_user( 1 );
}, 0 );
PHP
step "Starting the server"
PHP_CLI_SERVER_WORKERS=8 php -d memory_limit=512M -S "127.0.0.1:$PORT" -t "$WP_DIR" > "$ROOT/test/ios/build/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
until curl -sf -o /dev/null "$WP_BASE_URL/wp-login.php"; do
	kill -0 "$SERVER_PID" 2>/dev/null || { cat "$ROOT/test/ios/build/server.log"; echo "WordPress did not start"; exit 1; }
	sleep 1
done

# The editor page shows whether the plugin replaces core's bundles, which
# it only does when its build exists. Its first request also does the
# one-time work of a fresh site before the test's clock starts.
step "Loading the editor once"
# -b "" keeps the login cookie between redirects, in memory.
if ! EDITOR_HTML=$( curl -sSL --fail -b "" "$WP_BASE_URL/wp-admin/post-new.php" ); then
	echo "The editor did not load from $WP_BASE_URL"
	tail -40 "$ROOT/test/ios/build/server.log"
	exit 1
fi
if ! grep -q "/build/scripts/rich-text/" <<< "$EDITOR_HTML"; then
	echo "The editor loaded without this checkout's build. Run npm run build first."
	exit 1
fi

step "Waiting for the simulator"
xcrun simctl bootstatus "$UDID" -b
# Safari's tips cover the page on a fresh simulator, and a tap then only
# closes the tip.
xcrun simctl spawn "$UDID" defaults write com.apple.mobilesafari com.apple.TipKit.HideAllTips -bool YES
# Safari's first launch on a fresh simulator takes most of a minute, and
# the simulator then loses the test's first tap. Launch it once here.
step "Starting Safari once"
xcrun simctl openurl "$UDID" "$WP_BASE_URL/wp-login.php?warm-up"
for _ in $( seq 1 120 ); do
	grep -q "wp-login.php?warm-up" "$ROOT/test/ios/build/server.log" && break
	sleep 1
done
grep -q "wp-login.php?warm-up" "$ROOT/test/ios/build/server.log" ||
	{ echo "Safari did not open the page"; exit 1; }
# The login is remembered in a cookie, which outlives the server: start
# Safari without cookies from an earlier run.
xcrun simctl terminate "$UDID" com.apple.mobilesafari 2>/dev/null || true
SAFARI_DATA=$( xcrun simctl get_app_container "$UDID" com.apple.mobilesafari data )
if [[ -n "$SAFARI_DATA" && -d "$SAFARI_DATA" ]]; then
	rm -f "$SAFARI_DATA"/Library/Cookies/*.binarycookies
fi

step "Generating the Xcode project"
( cd test/ios && xcodegen generate --quiet )
step "Building and running the tests"
rm -rf test/ios/build/results.xcresult
STATUS=0
TEST_RUNNER_WP_BASE_URL="$WP_BASE_URL" xcodebuild test \
	-project test/ios/GutenbergIOS.xcodeproj \
	-scheme SafariTests \
	-destination "id=${UDID}" \
	-derivedDataPath test/ios/build \
	-resultBundlePath test/ios/build/results.xcresult \
	"$@" || STATUS=$?
exit "$STATUS"
