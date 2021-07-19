/**
 * External dependencies
 */
const babelJest = require( 'babel-jest' );

// Remove this workaround when https://github.com/facebook/jest/issues/11444 gets resolved in Jest.
const babelJestInterop = babelJest.__esModule ? babelJest.default : babelJest;

module.exports = babelJestInterop.createTransformer( {
	presets: [ '@wordpress/babel-preset-default' ],
} );
