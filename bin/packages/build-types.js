/* eslint-disable eslint-comments/disable-enable-pair, no-console */

/**
 * External dependencies
 */
const execa = require( 'execa' );
const glob = require( 'fast-glob' );
const path = require( 'path' );

const tscPath = path.resolve(
	__dirname,
	'..',
	'..',
	'node_modules',
	'.bin',
	'tsc'
);

async function main() {
	const packagesWithTs = await glob( 'packages/*/tsconfig.json', {
		cwd: path.resolve( __dirname, '..', '..' ),
	} );
	const projectPaths = packagesWithTs.map( ( tsconfigPath ) =>
		path.resolve( path.dirname( tsconfigPath ) )
	);

	const args = [ '-b', ...projectPaths, ...process.argv.slice( 2 ) ];

	try {
		await execa( tscPath, args, { stdio: 'inherit' } );
	} catch {
		process.exitCode = 1;
	}
}

main().catch( ( err ) => {
	throw err;
} );
