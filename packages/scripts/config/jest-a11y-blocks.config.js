const jestE2EConfig = require( './jest-e2e.config' );

const jestA11yBlocks = {
	...jestE2EConfig,
	setupFilesAfterEnv: [
		'@wordpress/jest-console',
		'@wordpress/jest-puppeteer-axe',
		'expect-puppeteer',
	],
	testMatch: [ '**/a11y-blocks/?(*.)spec.[jt]s?(x)' ],
};

module.exports = jestA11yBlocks;
