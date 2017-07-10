#!/usr/bin/env node
const command = process.argv[ 2 ];

if ( command === 'start' ) {
	require( './start' );
} else if ( command === 'build' ) {
	require( './build' );
} else {
	console.error( 'Unknown command ' + command ); // eslint-disable-line no-console
	process.exit( 1 );
}
