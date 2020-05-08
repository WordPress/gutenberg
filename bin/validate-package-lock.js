#!/usr/bin/env node
'use strict';

/**
 * External dependencies
 */
const { red, yellow } = require( 'chalk' );

/**
 * Internal dependencies
 */
const packageLock = require( '../package-lock' );

const dependencies = Object.entries( packageLock.dependencies );
for ( const [ name, dependency ] of dependencies ) {
	if ( dependency.resolved === false ) {
		console.log(
			`Invalid resolved dependency in package-lock.json.

${ red( JSON.stringify( { [ name ]: dependency }, null, '\t' ) ) }

To fix, try removing the node_modules directory, then run ${ yellow(
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
