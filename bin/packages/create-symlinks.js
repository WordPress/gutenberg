/**
 * External dependencies
 */
const { existsSync } = require( 'fs' );
const mkdirp = require( 'mkdirp' );
const { sync: symlinkOrCopy } = require( 'symlink-or-copy' );

process.stdout.write( '\nCreating symlinks…\n' );

mkdirp( 'node_modules/@wordpress', () => {
	const symlinksToCreate = [
		[ 'packages/browserslist-config', 'node_modules/@wordpress/browserslist-config' ],
		[ 'packages/babel-preset-default', 'node_modules/@wordpress/babel-preset-default' ],
		[ 'packages/jest-preset-default', 'node_modules/@wordpress/jest-preset-default' ],
		[ 'packages/npm-package-json-lint-config', 'node_modules/@wordpress/npm-package-json-lint-config' ],
		[ 'packages/scripts', 'node_modules/@wordpress/scripts' ],
		[ 'node_modules/@wordpress/scripts/bin/wp-scripts.js', 'node_modules/.bin/wp-scripts' ],
	];
	symlinksToCreate.forEach( ( [ srcPath, destPath ] ) => {
		if ( ! existsSync( destPath ) ) {
			symlinkOrCopy( srcPath, destPath );
		}
	} );
	process.stdout.write( 'DONE\n' );
} );
