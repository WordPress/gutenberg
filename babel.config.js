module.exports = function( api ) {
	api.cache( true );
	return {
		presets: [
			'module:metro-react-native-babel-preset',
		],
		plugins: [
			'react-require',
			/*'@babel/plugin-transform-async-to-generator',*/ /* <--- commented out to make the wpandroid release build work */
			'@babel/plugin-proposal-async-generator-functions',
			'@babel/plugin-transform-runtime',
			'react-native-classname-to-style',
			[
				'react-native-platform-specific-extensions',
				{
					extensions: [
						'css',
						'scss',
						'sass',
					],
				},
			],
		],
		env: {
			development: {
				plugins: [
					'@babel/transform-react-jsx-source',
				],
			},
		},
	};
};
