// Do this first so code under test observes the expected environment.
process.env.NODE_ENV = 'test';

const { readFileSync } = require( 'node:fs' );
const path = require( 'node:path' );
const { pathToFileURL } = require( 'node:url' );
const { getVitestOverrideConfigFile } = require( '../utils' );

const configFile = getVitestOverrideConfigFile( 'unit' );

if ( configFile ) {
	process.argv.splice( 2, 0, '--config', configFile );
}

const vitestPackagePath = require.resolve( 'vitest/package.json' );
const vitestPackage = JSON.parse( readFileSync( vitestPackagePath, 'utf8' ) );
const vitestBin = path.resolve(
	path.dirname( vitestPackagePath ),
	typeof vitestPackage.bin === 'string'
		? vitestPackage.bin
		: vitestPackage.bin.vitest
);

import( pathToFileURL( vitestBin ) ).catch( ( error ) => {
	console.error( error );
	process.exitCode = 1;
} );
