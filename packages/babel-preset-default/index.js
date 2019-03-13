module.exports = function( api ) {
	const isTestEnv = api.env() === 'test';

	return {
		presets: [
			! isTestEnv && [ require.resolve( '@babel/preset-env' ), {
				modules: false,
				targets: {
					browsers: require( '@wordpress/browserslist-config' ),
				},
			} ],
			isTestEnv && [ require.resolve( '@babel/preset-env' ), {
				useBuiltIns: 'usage',
			} ],
		].filter( Boolean ),
		plugins: [
			require.resolve( '@babel/plugin-proposal-object-rest-spread' ),
			[
				require.resolve( '@wordpress/babel-plugin-import-jsx-pragma' ),
				{
					scopeVariable: 'createElement',
					source: '@wordpress/element',
					isDefault: false,
				},
			],
			[ require.resolve( '@babel/plugin-transform-react-jsx' ), {
				pragma: 'createElement',
			} ],
			require.resolve( '@babel/plugin-proposal-async-generator-functions' ),
			! isTestEnv && [ require.resolve( '@babel/plugin-transform-runtime' ), {
				helpers: true,
				useESModules: false,
			} ],
		].filter( Boolean ),
	};
};
