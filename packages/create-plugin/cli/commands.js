/**
 * External depenedencies
 */
const program = require( 'commander' );

/**
 * Commander: CLI Command(s)
 */
program
	.version( '0.0.1' )
	.description( 'CLI Utility to scafffold WordPress Plugins and Blocks' )
	.parse( process.argv );

module.exports = program;
