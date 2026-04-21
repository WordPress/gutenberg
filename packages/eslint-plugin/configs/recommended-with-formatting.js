/**
 * External dependencies
 */
const globals = require( 'globals' );
const { fixupPluginRules } = require( '@eslint/compat' );
const importPlugin = fixupPluginRules( require( 'eslint-plugin-import' ) );

/**
 * Internal dependencies
 */
const jsxA11yConfig = require( './jsx-a11y' );
const customConfig = require( './custom' );
const reactConfig = require( './react' );
const esnextConfig = require( './esnext' );
const i18nConfig = require( './i18n' );

module.exports = [
	...jsxA11yConfig,
	...customConfig,
	...reactConfig,
	...esnextConfig,
	...i18nConfig,
	{
		plugins: {
			import: importPlugin,
		},
		languageOptions: {
			globals: {
				...globals.node,
				window: 'writable',
				document: 'writable',
				SCRIPT_DEBUG: 'readonly',
				wp: 'readonly',
			},
		},
		settings: {
			'import/extensions': [ '.js', '.jsx' ],
			'import/resolver': {
				typescript: true,
			},
		},
		rules: {
			'import/no-extraneous-dependencies': [
				'error',
				{
					peerDependencies: true,
				},
			],
			'import/no-unresolved': 'error',
			'import/default': 'warn',
			'import/named': 'warn',
		},
	},
];
