const webpack = require( 'webpack' );
const config = require( './webpack.config' );

const entryPointNames = [
	'blocks',
	'components',
	'date',
	'editor',
	'element',
	'i18n',
	'utils',
	'data',
];

const devServerConfig = {
	port: 3000,
	hot: true,
	headers: {
		'Access-Control-Allow-Origin': '*',
	},
};

const hrPlugins = [
	new webpack.HotModuleReplacementPlugin(),
	new webpack.NamedModulesPlugin(),
];

const hrEntries = [
	'react-hot-loader/patch',
	'webpack/hot/only-dev-server',
	'webpack-dev-server/client?http://localhost:3000',
];

// Update config
config.devServer = devServerConfig;
config.plugins = config.plugins.concat( hrPlugins );
config.output.publicPath = 'http://localhost:3000/';

for ( let i = 0; i < entryPointNames.length; i++ ) {
	const entryPointName = entryPointNames[ i ];
	config.entry[ entryPointName ] = [ ...hrEntries, config.entry[ entryPointName ] ];
}
config.entry.hooks = [ config.entry.hooks ];

module.exports = config;

