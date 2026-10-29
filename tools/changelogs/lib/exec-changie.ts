import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );

/**
 * Executes a Changie command using the bundled binary.
 *
 * @param args     Arguments passed to Changie.
 * @param repoRoot Path to the Gutenberg repo root.
 * @return Execution result with stdout, stderr, and exit code.
 */
export function execChangie(
	args: string[],
	repoRoot: string = process.cwd()
) {
	const changiePkgPath = require.resolve( 'changie/package.json' );
	const changiePkg = require( changiePkgPath );
	const changieBin = path.resolve(
		path.dirname( changiePkgPath ),
		changiePkg.bin.changie
	);

	return spawnSync( 'node', [ changieBin, ...args ], {
		cwd: repoRoot,
		encoding: 'utf8',
	} );
}
