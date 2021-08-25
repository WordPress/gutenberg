module.exports = {
	preset: 'jest-playwright-preset',
	testMatch: [ '**/specs/editor/blocks/**/*.js' ],
	testPathIgnorePatterns: [ '/node_modules/', '/wordpress/' ],
	testRunner: 'jest-circus/runner',
	reporters:
		'TRAVIS' in process.env && 'CI' in process.env
			? [
					'@wordpress/jest-preset-default/scripts/travis-fold-passes-reporter.js',
			  ]
			: undefined,
	setupFiles: [ '<rootDir>/config/gutenberg-phase.js' ],
	setupFilesAfterEnv: [
		'<rootDir>/config/setup-playwright.js',
		'@wordpress/jest-console',
	],
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
