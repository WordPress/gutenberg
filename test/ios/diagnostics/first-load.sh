#!/usr/bin/env bash
# Temporary diagnostics: installs a fresh site again and times the first
# editor load, several times, with the timing mu-plugin.
set -uo pipefail
ROOT="$PWD"
WP_DIR="$ROOT/test/ios/build/wordpress"
MU="$WP_DIR/wp-content/mu-plugins"
PORT=9401
URL="http://127.0.0.1:$PORT"
wp() { php -d memory_limit=512M "$ROOT/test/ios/build/cache/wp-cli.phar" --path="$WP_DIR" --quiet "$@"; }
php -v | head -1
mkdir -p "$ROOT/test/ios/build/diag"
mv "$MU/login.php" "$ROOT/test/ios/build/diag/login.php"
for i in $( seq 1 "${1:-8}" ); do
	rm -rf "$WP_DIR/wp-content/database" "$WP_DIR/timing.log" "$MU/login.php" "$MU/0-timing.php"
	wp core install --url="$URL" --title="iOS tests" --admin_user=admin --admin_password=password --admin_email=admin@example.com --skip-email
	wp plugin activate gutenberg
	wp config set DISABLE_WP_CRON "${NO_CRON:-false}" --raw
	cp "$ROOT/test/ios/build/diag/login.php" "$MU/login.php"
	cp "$ROOT/test/ios/diagnostics/timing.php" "$MU/0-timing.php"
	PHP_CLI_SERVER_WORKERS=8 php -d memory_limit=512M -d max_execution_time=0 -S "127.0.0.1:$PORT" -t "$WP_DIR" > /dev/null 2>&1 &
	SERVER=$!
	until curl -sf -o /dev/null "$URL/wp-login.php"; do sleep 1; done
	TIME=$( curl -sSL --max-time 180 -o /dev/null -w "%{time_total}" -b "" "$URL/wp-admin/post-new.php" )
	sleep 2
	pkill -P "$SERVER"; kill "$SERVER"; wait "$SERVER" 2>/dev/null
	echo "LOAD $i (no cron: ${NO_CRON:-false}): ${TIME}s"
	if awk "BEGIN { exit !( $TIME > 3 ) }"; then
		grep -v "rest end .* 0\.[0-4]" "$WP_DIR/timing.log" | sort | sed 's/^/    /'
	fi
done
