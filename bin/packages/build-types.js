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

function main() {
	const packagesWithTs = glob.sync( 'packages/*/tsconfig.json', {
		cwd: path.resolve( __dirname, '..', '..' ),
	} );
	const projectPaths = packagesWithTs.map( ( tsconfigPath ) =>
		path.dirname( tsconfigPath )
	);

	const args = [ '--build', ...projectPaths, ...process.argv.slice( 2 ) ];

	execa.sync( tscPath, args, { stdio: 'inherit' } );
}

main();
