module.exports = {
	...require( '@wordpress/scripts/config/jest-e2e.config' ),
	setupFiles: [
		'core-js/modules/web.dom.iterable',
		'<rootDir>/config/gutenberg-phase.js',
	],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-test-framework.js',
		'expect-puppeteer',
	],
	transformIgnorePatterns: [
		'node_modules',
		'scripts/config/puppeteer.config.js',
	],
};
