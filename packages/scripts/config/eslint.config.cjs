/**
 * Default ESLint flat config for @wordpress/scripts.
 *
 * Projects using `wp-scripts lint-js` that do not provide their own
 * eslint.config.* will use this config automatically.
 */

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const wpPlugin = require( '@wordpress/eslint-plugin' );

const config = [
	// Global ignores.
	{
		ignores: [ '**/build/**', '**/node_modules/**', '**/vendor/**' ],
	},

	// Base recommended config from @wordpress/eslint-plugin.
	...wpPlugin.configs.recommended,

	// Unit test overrides.
	...wpPlugin.configs[ 'test-unit' ].map( ( c ) => ( {
		...c,
		files: [ '**/@(test|__tests__)/**/*.js', '**/?(*.)test.js' ],
	} ) ),
];

// If the project has no Babel config, provide defaults.
if ( ! hasBabelConfig() ) {
	config.push( {
		languageOptions: {
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: [
						require.resolve( '@wordpress/babel-preset-default' ),
					],
				},
			},
		},
	} );
}

module.exports = config;
