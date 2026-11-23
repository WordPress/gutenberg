#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
directory=$(mktemp -d)
trap 'rm -rf "$directory"' EXIT

tarball=$(node --experimental-strip-types -p '
	const { packWorkspacePackage } = require( "./tools/validation/pack-workspace-package.ts" );
	packWorkspacePackage( "packages/wp-build", process.argv[ 1 ] );
' "$directory")

cp -R tools/validation/fixtures/wp-build-consumer "$directory/plugin"
cd "$directory/plugin"
npm install --engine-strict --no-audit --no-fund "$tarball"
npm run build
grep -Fq 'Hello from the plugin' build/scripts/greeting/index.min.js
grep -Fq "'example-greeting'" build/scripts/registry.php
