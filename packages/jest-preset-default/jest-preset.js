module.exports = {
	moduleNameMapper: {
		'\\.(scss|css)$':
			'<rootDir>/node_modules/@wordpress/jest-preset-default/scripts/style-mock.js',
	},
	modulePaths: [ '<rootDir>' ],
	setupFiles: [
		'<rootDir>/node_modules/@wordpress/jest-preset-default/scripts/setup-globals.js',
	],
	setupFilesAfterEnv: [
		'<rootDir>/node_modules/@wordpress/jest-preset-default/scripts/setup-test-framework.js',
	],
	snapshotSerializers: [ '<rootDir>/node_modules/enzyme-to-json/serializer.js' ],
	testMatch: [
		'**/__tests__/**/*.[jt]s',
		'**/test/*.[jt]s',
		'**/?(*.)test.[jt]s',
	],
	testPathIgnorePatterns: [ '/node_modules/', '/wordpress/' ],
	timers: 'fake',
	transform: {
		'^.+\\.[jt]sx?$': '<rootDir>/node_modules/babel-jest',
	},
	verbose: true,
	reporters:
		'TRAVIS' in process.env && 'CI' in process.env ?
			[
				'../../../@wordpress/jest-preset-default/scripts/travis-fold-passes-reporter.js',
			] :
			undefined,
};
