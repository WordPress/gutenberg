#!/usr/bin/env node
import { parseArgs } from 'node:util';
import path from 'node:path';
import { previewUnreleasedFragments } from '../lib/preview.ts';
import { getChangieProjects } from '../lib/config.ts';

const REPO_ROOT = path.resolve( import.meta.dirname, '../../..' );

const options = parseArgs( {
	options: {
		package: { type: 'string', short: 'p' },
	},
	allowPositionals: true,
} );

const pkg = options.values.package || options.positionals[ 0 ];

if ( pkg ) {
	console.log( previewUnreleasedFragments( pkg, REPO_ROOT ) );
} else {
	const projects = getChangieProjects( REPO_ROOT );
	if ( projects.length === 0 ) {
		console.log( 'No packages currently configured for Changie.' );
	} else {
		for ( const p of projects ) {
			console.log( previewUnreleasedFragments( p, REPO_ROOT ) );
		}
	}
}
