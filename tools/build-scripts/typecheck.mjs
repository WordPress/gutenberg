#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import spawn from 'cross-spawn';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

/*
 * Same failure hint as the build, so a red CI run points at the fix.
 * `--pretty` keeps related info (e.g. the tsconfig behind a bad `types`
 * entry) that tsc drops when stdout is not a TTY, as in CI.
 */
const result = spawn.sync(
	'tsc',
	[ '--build', '--pretty', ...process.argv.slice( 2 ) ],
	{
		cwd: ROOT_DIR,
		stdio: 'inherit',
	}
);

if ( result.status !== 0 ) {
	console.error(
		'\n❌ Type check failed. Try cleaning up first: `npm run clean:package-types`'
	);
}
process.exit( result.status ?? 1 );
