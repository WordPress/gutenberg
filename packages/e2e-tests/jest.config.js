module.exports = {
	...require( '@wordpress/scripts/config/jest-e2e.config' ),
	setupFiles: [ '<rootDir>/config/gutenberg-phase.js' ],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-debug-artifacts.js',
		'<rootDir>/config/setup-test-framework.js',
		'<rootDir>/config/setup-visual-regression-test.js',
		'@wordpress/jest-console',
		'@wordpress/jest-puppeteer-axe',
		'expect-puppeteer',
	],
	testPathIgnorePatterns: [
		'/node_modules/',
		'e2e-tests/specs/performance/',
	],
};
