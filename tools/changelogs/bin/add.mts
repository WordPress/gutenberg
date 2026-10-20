#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );
const changiePkgPath = require.resolve( 'changie/package.json' );
const changiePkg = require( changiePkgPath );
const changieBin = path.resolve(
	path.dirname( changiePkgPath ),
	changiePkg.bin.changie
);

const args = process.argv.slice( 2 );

// Run changie with provided arguments
const result = spawnSync( 'node', [ changieBin, 'new', ...args ], {
	stdio: 'inherit',
	cwd: path.resolve( import.meta.dirname, '../../..' ),
} );

process.exit( result.status ?? 0 );
