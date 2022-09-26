module.exports = {
	...require( '@wordpress/scripts/config/jest-e2e.config' ),
	testMatch: [ '**/performance/*.test.js' ],
	setupFiles: [ '<rootDir>/config/is-gutenberg-plugin.js' ],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-performance-test.js',
		'@wordpress/jest-console',
		'@wordpress/jest-puppeteer-axe',
		'expect-puppeteer',
	],
	transformIgnorePatterns: [
		'node_modules',
		'scripts/config/puppeteer.config.js',
	],
	reporters: [ 'default', '<rootDir>/config/performance-reporter.js' ],
};
