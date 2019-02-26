module.exports = function( api ) {
	const isTestEnv = api.env() === 'test';

	return {
		presets: [
			! isTestEnv && [ '@babel/preset-env', {
				modules: false,
				targets: {
					browsers: [ 'extends @wordpress/browserslist-config' ],
				},
			} ],
			isTestEnv && [ '@babel/preset-env', {
				useBuiltIns: 'usage',
			} ],
		].filter( Boolean ),
		plugins: [
			'@babel/plugin-proposal-object-rest-spread',
			[
				'@wordpress/babel-plugin-import-jsx-pragma',
				{
					scopeVariable: 'createElement',
					source: '@wordpress/element',
					isDefault: false,
				},
			],
			[ '@babel/plugin-transform-react-jsx', {
				pragma: 'createElement',
			} ],
			'@babel/plugin-proposal-async-generator-functions',
			! isTestEnv && [ '@babel/plugin-transform-runtime', {
				corejs: false, // We polyfill so we don't need core-js.
				helpers: true,
				regenerator: false, // We polyfill so we don't need regenerator.
				useESModules: false,
			} ],
		].filter( Boolean ),
	};
};
