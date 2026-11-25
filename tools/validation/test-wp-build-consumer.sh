#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
directory=$(mktemp -d)
trap 'rm -rf "$directory"' EXIT

# Pack the workspace dependencies too, so the plugin builds with their source
# in this checkout instead of their latest npm releases.
node --experimental-strip-types -e '
	const { packWorkspacePackage } = require( "./tools/validation/pack-workspace-package.ts" );
	for ( const name of [ "browserslist-config", "style-runtime", "theme-build-tools", "wp-build" ] ) {
		packWorkspacePackage( `packages/${ name }`, process.argv[ 1 ] );
	}
' "$directory"

cp -R tools/validation/fixtures/wp-build-consumer "$directory/plugin"
cd "$directory/plugin"
npm install --engine-strict --ignore-scripts --no-audit --no-fund "$directory"/*.tgz
npm run build
grep -Fq 'Hello from the plugin' build/scripts/greeting/index.min.js
grep -Fq 'margin-inline-start:1px' build/scripts/greeting/index.min.js
grep -Fq "'example-greeting'" build/scripts/registry.php
grep -Fq '.greeting{color:#1e1e1e}' build/styles/greeting/style.min.css
