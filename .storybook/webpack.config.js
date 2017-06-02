const config = require( '../webpack.config' );
config.module.rules = [
	...config.module.rules,
	{
		test: /\.md/,
		use: 'raw-loader',
	},
];
config.externals = [];

module.exports = config;
