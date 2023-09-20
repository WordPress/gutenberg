/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
const { cosmiconfigSync } = require( 'cosmiconfig' );

const searchConfig = ( confName ) => {
	const explorer = cosmiconfigSync( confName );
	return explorer.search() !== null;
};

module.exports = { searchConfig };
