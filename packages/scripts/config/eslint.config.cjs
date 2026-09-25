/**
 * Default ESLint flat config for @wordpress/scripts.
 *
 * Projects using `wp-scripts lint-js` that do not provide their own
 * eslint.config.* will use this config automatically.
 */
const { hasBabelConfig } = require( '../utils' );
const wpPlugin = require( '@wordpress/eslint-plugin' );

const config = [
	// Global ignores.
	{
		ignores: [ '**/build/**', '**/node_modules/**', '**/vendor/**' ],
	},

	/*
	 * ESLint's default file discovery covers only `.js`, `.mjs` and `.cjs`.
	 * Every other extension has to be named before any config below applies.
	 */
	{ files: [ '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts' ] },

	// Base recommended config from @wordpress/eslint-plugin.
	...wpPlugin.configs.recommended,

	// Unit test overrides.
	...wpPlugin.configs[ 'test-unit' ].map( ( c ) => ( {
		...c,
		files: [
			'**/@(test|__tests__)/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
			'**/*.@(test|spec).{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
		],
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
