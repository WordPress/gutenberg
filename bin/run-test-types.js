/**
 * External dependencies
 */
const glob = require( 'glob' );
const { execSync } = require( 'child_process' );
const path = require( 'path' );
let hasError = false;

// Find all tsconfig.json files within test-types directories.
const tsconfigPaths = glob.sync( '**/test-types/**/tsconfig.json' );

if ( tsconfigPaths.length > 0 ) {
	tsconfigPaths.forEach( ( tsconfigPath ) => {
		const dir = path.dirname( tsconfigPath );
		const command = `npx tsc --project ${ tsconfigPath }`;
		console.log( `Testing types in ${ dir }` );
		try {
			execSync( command, { stdio: 'inherit' } );
		} catch ( error ) {
			hasError = true;
		}
	} );

	if ( hasError ) {
		process.exit( 1 );
	}
}
