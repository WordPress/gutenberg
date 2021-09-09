module.exports = {
	preset: 'jest-playwright-preset',
	reporters: [ 'default', '<rootDir>/config/performance-reporter.js' ],
	setupFiles: [ '<rootDir>/config/gutenberg-phase.js' ],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-playwright.js',
		'@wordpress/jest-console',
	],
	testMatch: [ '**/performance/*.test.js' ],
	testPathIgnorePatterns: [ '/node_modules/', '/wordpress/' ],
	testRunner: 'jest-circus/runner',
	testEnvironmentOptions: {
		'jest-playwright': {
			launchOptions: {
				devtools: process.env.PLAYWRIGHT_DEVTOOLS === 'true',
				headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
				slowMo: parseInt( process.env.PLAYWRIGHT_SLOWMO, 10 ) || 0,
				args: [ '--enable-blink-features=ComputedAccessibilityInfo' ],
			},
		},
	},
};
