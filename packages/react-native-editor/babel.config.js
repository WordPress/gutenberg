/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = function ( api ) {
	api.cache( true );
	return {
		presets: [ 'module:metro-react-native-babel-preset' ],
		plugins: [
			path.resolve(
				__dirname,
				'../../node_modules/@babel/plugin-proposal-async-generator-functions'
			),
			'@babel/plugin-transform-runtime',
			[
				'react-native-platform-specific-extensions',
				{
					extensions: [ 'css', 'scss', 'sass' ],
				},
			],
			path.resolve(
				__dirname,
				'../../node_modules/react-native-reanimated/plugin'
			),
		],
		overrides: [
			{
				// Transforms JSX into JS function calls and use `createElement` instead of the default `React.createElement`
				plugins: [
					[
						'@babel/plugin-transform-react-jsx',
						{
							pragma: 'createElement',
							pragmaFrag: 'Fragment',
						},
					],
				],
				exclude: /node_modules\/(react-native|@react-native-community|@react-navigation|react-native-reanimated)/,
			},
			{
				// Auto-add `import { createElement } from '@wordpress/element';` when JSX is found
				plugins: [
					[
						'@wordpress/babel-plugin-import-jsx-pragma',
						{
							scopeVariable: 'createElement',
							scopeVariableFrag: 'Fragment',
							source: '@wordpress/element',
							isDefault: false,
						},
					],
				],
				exclude: /node_modules\/(react-native|@react-native-community|@react-navigation|react-native-reanimated)/,
			},
		],
		env: {
			development: {
				plugins: [ '@babel/transform-react-jsx-source' ],
			},
			production: {
				plugins: [ 'transform-remove-console' ],
			},
		},
	};
};
