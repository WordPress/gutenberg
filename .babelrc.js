const isTestEnv = ( process.env.NODE_ENV === 'test' );

module.exports = {
	presets: [
		! isTestEnv && [ require( 'babel-preset-env' ), {
			modules: false,
			targets: {
				browsers: [ 'extends @wordpress/browserslist-config' ],
			},
		} ],
		isTestEnv && [ require( 'babel-preset-env' ) ],
	].filter( Boolean ),
	plugins: [
		require( 'babel-plugin-transform-object-rest-spread' ),
		[ require( 'babel-plugin-transform-react-jsx' ), {
			pragma: 'wp.element.createElement',
		} ],
		! isTestEnv && require( 'babel-plugin-transform-runtime' ),
		'transform-async-generator-functions',
	].filter( Boolean ),
	env: {
		production: {
			plugins: [
				[
					'@wordpress/babel-plugin-makepot',
					{
						output: 'languages/gutenberg.pot',
					},
				],
			],
		},
	},
};
