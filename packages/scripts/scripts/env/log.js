/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );
const { normalize } = require( 'path' );

/**
 * Internal dependencies
 */
const { hasArgInCLI } = require( '../../utils' );

const logFile = normalize( `${ env.WP_DEVELOP_DIR }/src/wp-content/debug.log` );

if ( hasArgInCLI( 'clean' ) ) {
	execSync( `> ${ logFile }`, { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
} else {
	execSync( `touch ${ logFile } && tail -F ${ logFile }`, { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
}
