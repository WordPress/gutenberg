/**
 * WordPress dependencies
 */
const baseConfig = require( '@wordpress/scripts/config/jest-e2e.config' );

module.exports = {
	...baseConfig,
	testMatch: [ '<rootDir>/specs/**/*.test.js' ],
	setupFiles: [ '<rootDir>/config/gutenberg-phase.js' ],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-test-framework.js',
		'@wordpress/jest-console',
		'@wordpress/jest-puppeteer-axe',
		'expect-puppeteer',
		'puppeteer-testing-library/extend-expect',
	],
	testPathIgnorePatterns: [
		'/node_modules/',
		'e2e-tests/specs/performance/',
	],
	reporters: [
		...baseConfig.reporters,
		// Report flaky tests results into artifacts for used in `report-flaky-tests` action.
		process.env.CI && '<rootDir>/config/flaky-tests-reporter.js',
	].filter( Boolean ),
};
