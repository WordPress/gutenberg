#!/usr/bin/env node
'use strict';

const { spawnSync } = require( 'node:child_process' );
const path = require( 'node:path' );

const SUPPRESSIONS_FILE = path.join( __dirname, 'stylelint-suppressions.json' );

const userArgs = process.argv.slice( 2 );
const args = userArgs.some( ( arg ) =>
	arg.startsWith( '--suppress-location' )
)
	? userArgs
	: [ `--suppress-location=${ SUPPRESSIONS_FILE }`, ...userArgs ];

const wpScriptsBin = require.resolve( '@wordpress/scripts/bin/wp-scripts.js' );

const result = spawnSync(
	process.execPath,
	[ wpScriptsBin, 'lint-style', ...args ],
	{ stdio: 'inherit' }
);

process.exit( result.status ?? 1 );
