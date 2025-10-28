/**
 * External dependencies
 */
const babelJest = require( 'babel-jest' );

// TODO: this was resolved so remove this workaround https://github.com/facebook/jest/issues/11444
const babelJestInterop = babelJest.__esModule ? babelJest.default : babelJest;

module.exports = babelJestInterop.createTransformer( {
	presets: [ '@wordpress/babel-preset-default' ],
} );
