module.exports = {
	...require( '@wordpress/scripts/config/jest-e2e.config' ),
	setupTestFrameworkScriptFile: '<rootDir>/config/setup-test-framework.js',
	setupFiles: [
		'<rootDir>/config/gutenberg-phase.js',
	],
};
