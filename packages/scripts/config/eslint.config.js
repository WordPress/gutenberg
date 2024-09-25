/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );
/**
 * WordPress dependencies
 */
const wordPress = require( '@wordpress/eslint-plugin' );

const eslintConfig = [
	{
		ignores: [ '**/build/', '**/node_modules/', '**/vendor/' ],
	},
	...wordPress.configs.recommended.map( ( config ) => ( {
		...config,
		files: [ '**/.*js', '**/*.jsx', '**/*.ts', '**/*.tsx' ],
	} ) ),
	{
		...wordPress.configs[ 'test-unit' ],
		// Unit test files and their helpers only.
		files: [ '**/@(test|__tests__)/**/*.js', '**/?(*.)test.js' ],
	},
];

if ( ! hasBabelConfig() ) {
	eslintConfig.forEach( ( config ) => {
		config.languageOptions = {
			...config?.languageOptions,
			parserOptions: {
				...config?.languageOptions?.parserOptions,
				requireConfigFile: false,
				babelOptions: {
					presets: [
						require.resolve( '@wordpress/babel-preset-default' ),
					],
				},
			},
		};
	} );
}

module.exports = eslintConfig;
