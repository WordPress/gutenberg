module.exports = {
	moduleNameMapper: {
		'\\.(scss|css)$': require.resolve(
			'@wordpress/jest-preset-default/scripts/style-mock.js'
		),
	},
	modulePaths: [ '<rootDir>' ],
	setupFiles: [
		require.resolve(
			'@wordpress/jest-preset-default/scripts/setup-globals.js'
		),
	],
	setupFilesAfterEnv: [
		require.resolve(
			'@wordpress/jest-preset-default/scripts/setup-test-framework.js'
		),
	],
	snapshotSerializers: [ require.resolve( 'enzyme-to-json/serializer.js' ) ],
	testMatch: [
		'**/__tests__/**/*.[jt]s',
		'**/test/*.[jt]s',
		'**/?(*.)test.[jt]s',
	],
	testPathIgnorePatterns: [ '/node_modules/', '/wordpress/' ],
	timers: 'fake',
	transform: {
		'^.+\\.[jt]sx?$': require.resolve( 'babel-jest' ),
	},
	verbose: true,
	reporters:
		'TRAVIS' in process.env && 'CI' in process.env
			? [
					require.resolve(
						'@wordpress/jest-preset-default/scripts/travis-fold-passes-reporter.js'
					),
			  ]
			: undefined,
};
