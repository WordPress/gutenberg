/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );

/**
 * Internal dependencies
 */
const { getArgFromCLI, hasArgInCLI } = require( '../utils' );
const { checkDeps, getLicenses } = require( '../utils/license' );

/*
 * WARNING: Changes to this file may inadvertently cause us to distribute code that
 * is not GPL2 compatible.
 *
 * When adding a new license (for example, when a new package has a variation of the
 * various license strings), please ensure that changes to this file are explicitly
 * reviewed and approved.
 */

const prod = hasArgInCLI( '--prod' ) || hasArgInCLI( '--production' );
const dev = hasArgInCLI( '--dev' ) || hasArgInCLI( '--development' );
const gpl2 = hasArgInCLI( '--gpl2' );
const ignored = hasArgInCLI( '--ignore' )
	? getArgFromCLI( '--ignore' )
			// "--ignore=a, b" -> "[ 'a', ' b' ]"
			.split( ',' )
			// "[ 'a', ' b' ]" -> "[ 'a', 'b' ]"
			.map( ( moduleName ) => moduleName.trim() )
	: [];

let query = '';
if ( prod ) {
	query += '.prod';
} else if ( dev ) {
	query += '.dev';
} else {
	query += '*';
}

query += `:not(${ getLicenses( gpl2 )
	.map( ( license ) => `[license=${ JSON.stringify( license ) }]` )
	.join( ',' ) })`;

// Use `npm query` to grab a list of all the packages.
const child = spawn.sync( 'npm', [ 'query', query ] );

const packages = JSON.parse( child.stdout.toString() );

checkDeps( packages, { ignored, gpl2 } );
