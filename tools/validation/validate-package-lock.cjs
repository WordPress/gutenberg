#!/usr/bin/env node
'use strict';

// This script validates `package-lock.json` to avoid the introduction of an
// erroneous `"resolved": false` value. It appears to be related to an upstream
// unresolved issue with NPM. If the upstream issue is resolved, this script
// should no longer be necessary.
//
// See: https://github.com/npm/cli/issues/1138
const path = require( 'path' );
const { readFileSync } = require( 'fs' );
const { red, yellow } = require( 'chalk' );
// An optional path argument lets tests point the script at a fixture.
const packageLockPath = process.argv[ 2 ]
	? path.resolve( process.argv[ 2 ] )
	: path.resolve( __dirname, '../../package-lock.json' );
const packageLock = JSON.parse( readFileSync( packageLockPath, 'utf8' ) );

const dependencies = /** @type {Array<[string, any]>} */ (
	Object.entries( packageLock.packages )
);

// Every location where `caniuse-lite` is installed, keyed by its version.
/** @type {Map<string, string[]>} */
const caniuseLiteVersions = new Map();

for ( const [ name, dependency ] of dependencies ) {
	// A package's `dependencies` field can map names to version ranges, which
	// are strings. Only entries with a resolved `version` are installs.
	if (
		name.split( 'node_modules/' ).pop() === 'caniuse-lite' &&
		typeof dependency.version === 'string'
	) {
		const locations = caniuseLiteVersions.get( dependency.version ) ?? [];
		locations.push( name );
		caniuseLiteVersions.set( dependency.version, locations );
	}

	if ( dependency.resolved === false ) {
		console.log(
			`Invalid resolved dependency in package-lock.json.

${ red( JSON.stringify( { [ name ]: dependency }, null, '\t' ) ) }

To fix, try removing the node_modules directory and reverting package-lock.json, then run ${ yellow(
				'npm install'
			) }.
`
		);

		process.exit( 1 );
	}

	if ( dependency.dependencies ) {
		dependencies.push( ...Object.entries( dependency.dependencies ) );
	}
}

// More than one `caniuse-lite` means packages read different browser data, so
// builds that depend on it (browserslist, autoprefixer) can disagree.
// See: https://github.com/WordPress/gutenberg/issues/33344
if ( caniuseLiteVersions.size > 1 ) {
	const found = [ ...caniuseLiteVersions ]
		.map(
			( [ version, locations ] ) =>
				`${ version }\n${ locations
					.map( ( location ) => `    ${ location }` )
					.join( '\n' ) }`
		)
		.join( '\n' );

	console.log(
		`Multiple versions of caniuse-lite in package-lock.json:

${ red( found ) }

To fix, run ${ yellow( 'npx update-browserslist-db@latest' ) } and then ${ yellow(
			'npm dedupe'
		) }.
`
	);

	process.exit( 1 );
}
