#!/bin/bash
#
# Runs one CI shard of the e2e suite split across several WordPress sites that
# share the single wp-env test environment (one Apache, one MySQL). Each site
# is reached on its own loopback address, 127.0.0.<n>:8889, and wp-config.php
# gives each address its own table prefix and uploads folder.
#
# Linux only: other loopback addresses don't reach Docker on macOS by default.
#
# Usage, from the repository root, after `npm run wp-env-test start`:
#   test/e2e/wp-env-sites.sh <sites> <part> <total parts> [playwright args]

set -euo pipefail

sites=$1
part=$2
total=$3
shift 3

root=$( pwd )
port=8889
logs=${RUNNER_TEMP:-/tmp}/e2e-sites
mkdir -p "$logs"

echo "::group::Set up the extra sites"

# Runs inside the cli container, where the checkout is the gutenberg plugin.
cat > "$root/.e2e-sites-setup.sh" <<'SH'
set -eo pipefail
sites=$1
port=$2
site_number="( preg_match( '/^127\.0\.0\.([2-9]):/', \$_SERVER['HTTP_HOST'] ?? '', \$m ) ? \$m[1] : '' )"
host="( \$_SERVER['HTTP_HOST'] ?? 'localhost:$port' )"
wp config set table_prefix "'wp' . $site_number . '_'" --type=variable --raw
wp config set WP_HOME "'http://' . $host" --raw
wp config set WP_SITEURL "'http://' . $host" --raw
wp config set UPLOADS "'wp-content/uploads' . ( $site_number ? '-' . $site_number : '' )" --raw
plugins=$( wp plugin list --status=active --field=name --url=http://localhost:$port )
theme=$( wp theme list --status=active --field=name --url=http://localhost:$port )
for n in $( seq 2 "$sites" ); do
	url=http://127.0.0.$n:$port
	wp core install --url="$url" --title=Gutenberg --admin_user=admin --admin_password=password --admin_email=wordpress@example.com --skip-email
	wp rewrite structure '/%year%/%monthnum%/%day%/%postname%/' --hard --url="$url"
	wp plugin activate $plugins --url="$url"
	wp theme activate "$theme" --url="$url"
done
SH
npx wp-env --config .wp-env.test.json run cli bash wp-content/plugins/gutenberg/.e2e-sites-setup.sh "$sites" "$port"
for site in $( seq 1 "$sites" ); do
	curl -sS -o /dev/null -w "site $site: %{http_code}\n" "http://127.0.0.$site:$port/wp-login.php"
done

echo "::endgroup::"

pids=()
for site in $( seq 1 "$sites" ); do
	shard=$(( ( part - 1 ) * sites + site ))
	(
		cd "$root/test/e2e"
		WP_BASE_URL="http://127.0.0.$site:$port" \
		WP_ARTIFACTS_PATH="$root/test/e2e/artifacts/site-$site" \
		PLAYWRIGHT_BLOB_OUTPUT_FILE="$root/test/e2e/blob-report/report-$shard.zip" \
			xvfb-run --server-num=$(( 98 + site )) --server-args="-screen 0 1280x960x24" -- \
			npx playwright test --config playwright.config.ts --shard="$shard/$(( total * sites ))" "$@"
	) > "$logs/tests-$site.log" 2>&1 &
	pids+=( $! )
done

status=0
for site in $( seq 1 "$sites" ); do
	wait "${pids[$(( site - 1 ))]}" || status=1
	echo "::group::Site $site"
	cat "$logs/tests-$site.log"
	echo "::endgroup::"
done

exit $status
