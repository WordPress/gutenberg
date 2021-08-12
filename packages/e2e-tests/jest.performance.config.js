/**
 * External dependencies
 */
const path = require( 'path' );

const { ENVIRONMENT_DIRECTORY = '<rootDir>' } = process.env;

module.exports = {
	...require( '@wordpress/scripts/config/jest-e2e.config' ),
	testMatch: [ '**/performance/*.test.js' ],
	setupFiles: [ '<rootDir>/config/gutenberg-phase.js' ],
	moduleNameMapper: {
		// Use different versions of e2e-test-utils for different environments
		// rather than always using the latest.
		[ `@wordpress\\/e2e-test-utils$` ]: path.join(
			ENVIRONMENT_DIRECTORY,
			'packages/e2e-test-utils/src'
		),
	},
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
