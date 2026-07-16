// Import the default config file and expose it in the project root.
// Useful for editor integrations.
const baseConfig = require( './packages/prettier-config' );

module.exports = {
	...baseConfig,
	overrides: [
		...( baseConfig.overrides ?? [] ),
		{
			files: [ 'changelog.txt' ],
			options: { parser: 'markdown' },
		},
	],
};
