module.exports = function( api ) {
	api.cache.never();

	return {
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
		overrides: [
			{
				include: [
					'./index.js',
					'./node_modules/',
					'./packages/mobile/',
				],
				presets: [
					'module:metro-react-native-babel-preset',
				],
			},
			{
				exclude: [
					'./index.js',
					'./node_modules/',
					'./packages/mobile/',
				],
				presets: [
					'@wordpress/babel-preset-default',
				],
				plugins: [
					[
						'@wordpress/babel-plugin-import-jsx-pragma',
						{
							scopeVariable: 'createElement',
							source: '@wordpress/element',
							isDefault: false,
						},
					],
				],
			},
		],
	};
};
