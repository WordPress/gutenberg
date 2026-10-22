#!/bin/bash
#
# Runs one CI shard of the e2e suite split across several WordPress sites,
# each served by PHP's built-in server with a SQLite database, so the shard
# runs that many tests at once instead of one.
#
# Usage, from the repository root:
#   test/e2e/php-server-shards.sh <sites> <part> <total parts> [playwright args]
#
# Part <part> of <total parts> becomes sub-shards ((part - 1) * sites + 1)
# to (part * sites) of (total parts * sites), one per site.

set -euo pipefail

sites=$1
part=$2
total=$3
shift 3

root=$( pwd )
work=${RUNNER_TEMP:-/tmp}/e2e-sites
base="$work/base"
php=${PHP:-php}

rm -rf "$work"
mkdir -p "$work/downloads"

echo "::group::Set up WordPress"

core=$( node -p "require( './.wp-env.test.json' ).core" )
curl -sSfL "https://github.com/${core}/archive/HEAD.tar.gz" -o "$work/downloads/core.tar.gz"
mkdir -p "$base"
tar -xzf "$work/downloads/core.tar.gz" -C "$base" --strip-components=1
content="$base/wp-content"

curl -sSfL https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip -o "$work/downloads/sqlite.zip"
unzip -q "$work/downloads/sqlite.zip" -d "$content/plugins"
sed -e "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$content/plugins/sqlite-database-integration#" \
	-e 's#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#' \
	"$content/plugins/sqlite-database-integration/db.copy" > "$content/db.php"

# The same mappings as .wp-env.test.json. A local folder that has a download
# mapped inside it becomes a real folder of links, so the download lands in
# the site rather than in the checkout.
node -e '
	const mappings = require( "./.wp-env.test.json" ).mappings;
	const targets = Object.keys( mappings ).sort();
	for ( const target of targets ) {
		const source = mappings[ target ];
		const nested = targets.some( ( other ) => other.startsWith( target + "/" ) );
		const kind = source.startsWith( "http" ) ? "zip" : nested ? "dir" : "link";
		console.log( [ kind, target, source ].join( "\t" ) );
	}
' | while IFS=$'\t' read -r kind target source; do
	dest="$base/$target"
	rm -rf "$dest"
	mkdir -p "$( dirname "$dest" )"
	case $kind in
		link)
			ln -s "$root/$source" "$dest"
			;;
		dir)
			mkdir -p "$dest"
			for child in "$root/$source"/*; do
				ln -s "$child" "$dest/$( basename "$child" )"
			done
			;;
		zip)
			zip="$work/downloads/$( basename "$source" )"
			curl -sSfL "$source" -o "$zip"
			unzip -q "$zip" -d "$work/downloads/unzipped"
			mv "$work/downloads/unzipped/$( unzip -Z1 "$zip" | head -1 | cut -d/ -f1 )" "$dest"
			;;
	esac
done

cat > "$base/wp-config.php" <<'PHP'
<?php
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );
define( 'DB_DIR', __DIR__ . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );
$table_prefix = 'wp_';
define( 'WP_HOME', 'http://' . ( $_SERVER['HTTP_HOST'] ?? 'localhost' ) );
define( 'WP_SITEURL', WP_HOME );
define( 'WP_DEBUG', false );
define( 'SCRIPT_DEBUG', false );
define( 'WP_ENVIRONMENT_TYPE', 'local' );
define( 'FS_METHOD', 'direct' );
define( 'AUTOMATIC_UPDATER_DISABLED', true );
foreach ( array( 'AUTH', 'SECURE_AUTH', 'LOGGED_IN', 'NONCE' ) as $k ) {
	define( "{$k}_KEY", 'e2e-' . $k );
	define( "{$k}_SALT", 'e2e-salt-' . $k );
}
defined( 'ABSPATH' ) || define( 'ABSPATH', __DIR__ . '/' );
require_once ABSPATH . 'wp-settings.php';
PHP

cat > "$base/router.php" <<'PHP'
<?php
$path = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$file = __DIR__ . $path;
if ( is_file( $file ) ) {
	return false;
}
if ( is_dir( $file ) && is_file( rtrim( $file, '/' ) . '/index.php' ) ) {
	$_SERVER['SCRIPT_NAME'] = rtrim( $path, '/' ) . '/index.php';
	require rtrim( $file, '/' ) . '/index.php';
	return;
}
$_SERVER['SCRIPT_NAME'] = '/index.php';
require __DIR__ . '/index.php';
PHP

"$php" -d memory_limit=512M -r '
	$_SERVER["HTTP_HOST"] = "localhost";
	define( "WP_INSTALLING", true );
	require $argv[1] . "/wp-load.php";
	require ABSPATH . "wp-admin/includes/upgrade.php";
	wp_install( "Gutenberg", "admin", "admin@example.com", true, "", "password" );
	update_option( "permalink_structure", "/%postname%/" );
	require_once ABSPATH . "wp-admin/includes/plugin.php";
	$result = activate_plugin( "gutenberg/gutenberg.php" );
	if ( is_wp_error( $result ) ) {
		fwrite( STDERR, $result->get_error_message() . "\n" );
		exit( 1 );
	}
' "$base"

echo "::endgroup::"

pids=()
for site in $( seq 1 "$sites" ); do
	dir="$work/site-$site"
	cp -a "$base" "$dir"
	port=$( "$php" -r '$s = stream_socket_server( "tcp://127.0.0.1:0" ); echo explode( ":", stream_socket_get_name( $s, false ) )[1];' )
	PHP_CLI_SERVER_WORKERS=4 "$php" -d memory_limit=512M -S "127.0.0.1:$port" -t "$dir" "$dir/router.php" > "$work/server-$site.log" 2>&1 &
	until curl -s -o /dev/null "http://127.0.0.1:$port/wp-login.php"; do
		sleep 0.2
	done

	shard=$(( ( part - 1 ) * sites + site ))
	# A fixed display per site: parallel --auto-servernum calls can pick the same one.
	display=()
	if command -v xvfb-run > /dev/null; then
		display=( xvfb-run --server-num=$(( 98 + site )) --server-args="-screen 0 1280x960x24" -- )
	fi
	(
		cd "$root/test/e2e"
		WP_BASE_URL="http://127.0.0.1:$port" \
		WP_ARTIFACTS_PATH="$root/test/e2e/artifacts/site-$site" \
		PLAYWRIGHT_BLOB_OUTPUT_FILE="$root/test/e2e/blob-report/report-$shard.zip" \
			${display[@]+"${display[@]}"} npx playwright test --config playwright.config.ts --shard="$shard/$(( total * sites ))" "$@"
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

exit $status
