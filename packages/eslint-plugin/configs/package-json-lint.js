'use strict';

module.exports = {
	plugins: [ '@wordpress' ],
	overrides: [
		{
			files: [ '**/package.json' ],
			parser: require.resolve( 'jsonc-eslint-parser' ),
			rules: {
				'@wordpress/validate-package-json': 'error',
			},
		},
	],
};
