/**
 * External dependencies
 */
const minimist = require( 'minimist' );

/**
 * Internal dependencies
 */
const { getArgsFromCLI } = require( './process' );

const getArgFromCLI = ( arg ) => {
	for ( const cliArg of getArgsFromCLI() ) {
		const [ name, value ] = cliArg.split( '=' );
		if ( name === arg ) {
			return value || null;
		}
	}
};

const hasArgInCLI = ( arg ) => getArgFromCLI( arg ) !== undefined;

const getFileArgsFromCLI = () => minimist( getArgsFromCLI() )._;

const hasFileArgInCLI = () => getFileArgsFromCLI().length > 0;

module.exports = {
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
};
