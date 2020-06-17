module.exports = {
	preset: 'jest-playwright-preset',
	testMatch: [ '**/specs/**/*.[jt]s', '**/?(*.)spec.[jt]s' ],
	testPathIgnorePatterns: [ '/node_modules/', '/wordpress/' ],
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
};
