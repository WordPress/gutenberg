// Import the default config file and expose it in the project root.
// Useful for editor integrations.
import baseConfig from './packages/prettier-config/lib/index.js';

export default {
	...baseConfig,
	overrides: [
		...( baseConfig.overrides ?? [] ),
		{
			files: [ 'changelog.txt' ],
			options: { parser: 'markdown' },
		},
	],
};
