/**
 * External dependencies
 */
const { cosmiconfigSync } = require( 'cosmiconfig' );
const ESLintParser = require( '@babel/eslint-parser' );

const config = {
	languageOptions: {
		ecmaVersion: 6,
		parser: ESLintParser,
		parserOptions: {
			sourceType: 'module',
		},
	},
	rules: {
		// Disable ES5-specific (extended from ES5)
		'vars-on-top': 'off',

		// Enable ESNext-specific.
		'arrow-parens': [ 'error', 'always' ],
		'arrow-spacing': 'error',
		'computed-property-spacing': [ 'error', 'always' ],
		'constructor-super': 'error',
		'no-const-assign': 'error',
		'no-dupe-class-members': 'error',
		'no-duplicate-imports': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-constructor': 'error',
		'no-var': 'error',
		'object-shorthand': 'error',
		'prefer-const': [
			'error',
			{
				destructuring: 'all',
			},
		],
		quotes: [
			'error',
			'single',
			{ allowTemplateLiterals: true, avoidEscape: true },
		],
		'space-unary-ops': [
			'error',
			{
				overrides: {
					'!': true,
					yield: true,
				},
			},
		],
		'template-curly-spacing': [ 'error', 'always' ],
	},
};

// It won't recognize the `babel.config.json` file used in the project until the upstream bug in `cosmiconfig` is fixed:
// https://github.com/davidtheclark/cosmiconfig/issues/246.
const result = cosmiconfigSync( 'babel' ).search();
if ( ! result || ! result.filepath ) {
	config.languageOptions.parserOptions = {
		...config.languageOptions.parserOptions,
		configFile: false,
		babelOptions: {
			presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		},
	};
}

module.exports = [ ...require( './es5.js' ), config ];
