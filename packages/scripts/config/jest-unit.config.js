/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const jestUnitConfig = {
	preset: '@wordpress/jest-preset-default',
};

if ( ! hasBabelConfig() ) {
	jestUnitConfig.transform = {
		'^.+\\.jsx?$': path.join( __dirname, 'babel-transform' ),
	};
}

module.exports = jestUnitConfig;
