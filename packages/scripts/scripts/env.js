/**
 * Node dependencies.
 */
const { exit, stdout } = require( 'process' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	spawnScript,
} = require( '../utils' );

const args = getArgsFromCLI();

if ( ! args.length ) {
	stdout.write( 'Environment command required.' );
	exit( 1 );
}

const command = args.shift();

spawnScript( `env/${ command }`, args );
