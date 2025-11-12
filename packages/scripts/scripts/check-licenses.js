/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );

/**
 * Internal dependencies
 */
const { getArgFromCLI, hasArgInCLI } = require( '../utils' );
const { checkDepsInTree } = require( '../utils/license' );

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

// Use `npm ls` to grab a list of all the packages.
const child = spawn.sync(
	'npm',
	[
		'ls',
		'--json',
		'--long',
		'--all',
		...( prod ? [ '--omit=dev' ] : [] ),
		...( dev ? [ '--include=dev' ] : [] ),
	],
	/*
	 * Set the max buffer to ~157MB, since the output size for
	 * prod is ~21 MB and dev is ~110 MB
	 */
	{ maxBuffer: 1024 * 1024 * 150 }
);

const result = JSON.parse( child.stdout.toString() );

const topLevelDeps = result.dependencies;

checkDepsInTree( topLevelDeps, { ignored, gpl2 } );
