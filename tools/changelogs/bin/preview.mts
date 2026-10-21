#!/usr/bin/env node
import { parseArgs } from 'node:util';
import path from 'node:path';
import { previewUnreleasedFragments } from '../lib/preview.ts';

const REPO_ROOT = path.resolve( import.meta.dirname, '../../..' );

const options = parseArgs( {
	options: {
		package: { type: 'string', short: 'p' },
	},
	allowPositionals: true,
} );

const pkg = options.values.package || options.positionals[ 0 ];

if ( ! pkg ) {
	console.error(
		'Usage: npm run changelog:preview -- <package-name>\nExample: npm run changelog:preview -- components'
	);
	process.exit( 1 );
}

console.log( previewUnreleasedFragments( pkg, REPO_ROOT ) );
