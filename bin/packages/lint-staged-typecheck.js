/**
 * External dependencies
 */
const _ = require( 'lodash' );
const path = require( 'path' );
const fs = require( 'fs' );
const execa = require( 'execa' );

/* eslint-disable no-console */

const repoRoot = path.join( __dirname, '..', '..' );
const tscPath = path.join( repoRoot, 'node_modules', '.bin', 'tsc' );

// lint-staged passes full paths to staged changes
/** @type {string[]} */
const changedFiles = process.argv.slice( 2 );

// Transform changed files to package directories containing tsconfig.json
const changedPackages = _.uniq(
	changedFiles.map( ( fullPath ) => {
		const relativePath = path.relative( repoRoot, fullPath );
		return path.join( ...relativePath.split( path.sep ).slice( 0, 2 ) );
	} )
).filter( ( packageRoot ) =>
	fs.existsSync( path.join( packageRoot, 'tsconfig.json' ) )
);

try {
	execa.sync( tscPath, [ '--build', ...changedPackages ] );
} catch ( err ) {
	console.error( err.message );
	process.exitCode = 1;
}

/* eslint-enable no-console */
