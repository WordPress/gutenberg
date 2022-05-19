/**
 * Internal dependencies
 */
const { isPackageInstalled } = require( '../utils' );

// Exclude bundled WordPress packages from the list.
const wpPackagesRegExp = '^@wordpress/(?!(icons|interface))';

const config = {
	extends: [
		require.resolve( './jsx-a11y.js' ),
		require.resolve( './custom.js' ),
		require.resolve( './react.js' ),
		require.resolve( './esnext.js' ),
		require.resolve( './i18n.js' ),
	],
	plugins: [ 'import' ],
	env: {
		node: true,
	},
	globals: {
		window: true,
		document: true,
		wp: 'readonly',
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
};

// Don't apply Jest config if Playwright is installed.
if (
	isPackageInstalled( 'jest' ) &&
	! isPackageInstalled( '@playwright/test' )
) {
	config.overrides = [
		{
			// Unit test files and their helpers only.
			files: [ '**/@(test|__tests__)/**/*.js', '**/?(*.)test.js' ],
			extends: [ require.resolve( './test-unit.js' ) ],
		},
		{
			// End-to-end test files and their helpers only.
			files: [ '**/specs/**/*.js', '**/?(*.)spec.js' ],
			extends: [ require.resolve( './test-e2e.js' ) ],
		},
	];
}

module.exports = config;
