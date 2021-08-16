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
				// devtools: true,
				// headless: false, // use PWDEBUG=1 for headfull run with debugger window
				// slowMo: 100,
				args: [ '--enable-blink-features=ComputedAccessibilityInfo' ],
			},
		},
	},
};
