module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [
			'@wordpress/babel-preset-default',
			[
				'@babel/preset-react',
				{
					runtime: 'automatic',
					development: process.env.NODE_ENV === 'development',
					importSource: '@welldone-software/why-did-you-render',
				},
			],
		],
		plugins: [ 'babel-plugin-emotion', 'babel-plugin-inline-json-import' ],
	};
};
