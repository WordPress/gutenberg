/**
 * External dependencies
 */
const globals = require( 'globals' );
const importPlugin = require( 'eslint-plugin-import' );

// Exclude bundled WordPress packages from the list.
const wpPackagesRegExp = '^@wordpress/(?!(icons|interface|style-engine))';

const config = [
	...require( './jsx-a11y.js' ),
	...require( './custom.js' ),
	...require( './react.js' ),
	...require( './esnext.js' ),
	require( './i18n.js' ),
	{
		plugins: { import: importPlugin },
		languageOptions: {
			globals: {
				...globals.node,
				window: true,
				document: true,
				SCRIPT_DEBUG: 'readonly',
				wp: 'readonly',
			},
		},
		settings: {
			'import/internal-regex': wpPackagesRegExp,
			'import/extensions': [ '.js', '.jsx' ],
		},
		rules: {
			'import/no-extraneous-dependencies': [
				'error',
				{
					peerDependencies: true,
				},
			],
			'import/no-unresolved': [
				'error',
				{
					ignore: [ wpPackagesRegExp ],
				},
			],
			'import/default': 'warn',
			'import/named': 'warn',
		},
	},
];

module.exports = config;
