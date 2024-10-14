/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = function ( api ) {
	api.cache( true );
	return {
		presets: [ 'module:@react-native/babel-preset' ],
		plugins: [
			path.resolve(
				__dirname,
				'../../node_modules/@babel/plugin-transform-async-generator-functions'
			),
			'@babel/plugin-transform-runtime',
			'@babel/plugin-transform-named-capturing-groups-regex',
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
				exclude:
					/node_modules\/(react-native|@react-native-community|@react-navigation|react-native-reanimated)/,
			},
			{
				// Auto-add `import { createElement } from 'react';` when JSX is found.
				plugins: [
					[
						'@wordpress/babel-plugin-import-jsx-pragma',
						{
							scopeVariable: 'createElement',
							scopeVariableFrag: 'Fragment',
							source: 'react',
							isDefault: false,
						},
					],
				],
				exclude:
					/node_modules\/(react-native|@react-native-community|@react-navigation|react-native-reanimated)/,
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
