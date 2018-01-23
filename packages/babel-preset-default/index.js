const env = process.env.BABEL_ENV || process.env.NODE_ENV;
const isTestEnv = env === 'test';

module.exports = {
	presets: [
		! isTestEnv && [ require( 'babel-preset-env' ), {
			modules: false,
			targets: {
				browsers: [
					'last 2 Chrome versions',
					'last 2 Firefox versions',
					'last 2 Safari versions',
					'last 2 Edge versions',
					'last 2 Opera versions',
					'last 2 iOS versions',
					'last 1 Android version',
					'last 1 ChromeAndroid version',
					'ie 11',
					'> 1%',
				],
			},
		} ],
		isTestEnv && [ require( 'babel-preset-env' ) ],
	].filter( Boolean ),
	plugins: [
		require( 'babel-plugin-transform-object-rest-spread' ),
		[ require( 'babel-plugin-transform-react-jsx' ), {
			pragma: 'wp.element.createElement',
		} ],
		require( 'babel-plugin-transform-runtime' ),
		! isTestEnv && require( 'babel-plugin-lodash' ),
	].filter( Boolean ),
};
