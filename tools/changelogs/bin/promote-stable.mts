#!/usr/bin/env node
import { parseArgs } from 'node:util';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { promotePackageToStable } from '../lib/promote-stable.ts';

const REPO_ROOT = path.resolve( import.meta.dirname, '../../..' );

const options = parseArgs( {
	options: {
		package: { type: 'string', short: 'p' },
		pr: { type: 'string', short: 'm' },
		body: { type: 'string', short: 'b' },
		'dry-run': { type: 'boolean', default: false },
	},
	allowPositionals: true,
} );

const packageName = options.values.package || options.positionals[ 0 ];
if ( ! packageName ) {
	console.error(
		'Usage: npm run changelog:promote-stable -- <package-name> [--pr <PR#>] [--body <summary>] [--dry-run]'
	);
	process.exit( 1 );
}

let pr = options.values.pr;
const body = options.values.body;
const dryRun = options.values[ 'dry-run' ] || false;

async function main() {
	if ( ! pr ) {
		const rl = readline.createInterface( { input, output } );
		try {
			const answer = await rl.question(
				'Enter Gutenberg Pull Request Number: '
			);
			pr = answer.trim();
		} finally {
			rl.close();
		}
	}

	try {
		const res = promotePackageToStable( {
			packageName,
			pr: pr || '',
			body,
			dryRun,
			repoRoot: REPO_ROOT,
		} );

		if ( dryRun ) {
			console.log(
				`Dry-run promotion complete for @wordpress/${ res.packageName } (current version: ${ res.currentVersion }): would create fragment at ${ path.relative( REPO_ROOT, res.fragmentPath ) }`
			);
		} else {
			console.log(
				`Successfully created Stable Release fragment for @wordpress/${ res.packageName } (current version: ${ res.currentVersion }) at ${ path.relative( REPO_ROOT, res.fragmentPath ) }`
			);
		}
	} catch ( err: any ) {
		console.error( `Error: ${ err.message }` );
		process.exit( 1 );
	}
}

main();
