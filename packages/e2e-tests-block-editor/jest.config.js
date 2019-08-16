module.exports = {
	...require( '@wordpress/scripts/config/jest-e2e.config' ),
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-test-framework.js',
		'@wordpress/jest-console',
		'@wordpress/jest-puppeteer-axe',
		'expect-puppeteer',
	],
};
