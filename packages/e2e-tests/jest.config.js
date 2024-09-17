/**
 * WordPress dependencies
 */
const baseConfig = require( '@wordpress/scripts/config/jest-e2e.config' );

module.exports = {
	...baseConfig,
	testMatch: [ '<rootDir>/specs/**/*.test.js' ],
	setupFiles: [ '<rootDir>/config/is-gutenberg-plugin.js' ],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-test-framework.js',
		'@wordpress/jest-console',
		'@wordpress/jest-puppeteer-axe',
		'expect-puppeteer',
	],
	testPathIgnorePatterns: [ '/node_modules/' ],
	snapshotFormat: {
		escapeString: false,
		printBasicPrototype: false,
	},
	reporters: [
		...baseConfig.reporters,
		// Report flaky tests results into artifacts for used in `report-flaky-tests` action.
		process.env.CI && '<rootDir>/config/flaky-tests-reporter.js',
	].filter( Boolean ),
};
