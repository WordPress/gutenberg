/**
 * External dependencies
 */

const glob = require( 'glob' );
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

const config = {
	entry: {
		i18n: './i18n/index.js',
		blocks: './blocks/index.js',
		editor: './editor/index.js',
		element: './element/index.js'
	},
	output: {
		filename: '[name]/build/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this'
	},
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM'
	},
	module: {
		rules: [
			{
				test: /\.pegjs/,
				use: 'pegjs-loader'
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: 'babel-loader'
			},
			{
				test: /\.s?css$/,
				use: ExtractTextPlugin.extract( {
					use: [
						{ loader: 'raw-loader' },
						{ loader: 'postcss-loader' },
						{
							loader: 'sass-loader',
							query: {
								outputStyle: 'production' === process.env.NODE_ENV ?
									'compressed' : 'nested'
							}
						}
					]
				} )
			}
		]
	},
	plugins: [
		new ExtractTextPlugin( {
			filename: './[name]/build/style.css'
		} ),
		new webpack.LoaderOptionsPlugin( {
			minimize: process.env.NODE_ENV === 'production',
			debug: process.env.NODE_ENV !== 'production',
			options: {
				postcss: [
					require( 'autoprefixer' )
				]
			}
		} )
	]
};

switch ( process.env.NODE_ENV ) {
	case 'production':
		config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
		break;

	case 'test':
		config.target = 'node';
		config.module.rules = [
			...[ 'element', 'blocks', 'editor' ].map( ( entry ) => ( {
				test: require.resolve( './' + entry + '/index.js' ),
				use: 'expose-loader?wp.' + entry
			} ) ),
			...config.module.rules
		];
		config.entry = [
			'./element/index.js',
			'./blocks/index.js',
			'./editor/index.js',
			'./i18n/index.js',
			...glob.sync( `./{${ Object.keys( config.entry ).join() }}/**/test/*.js` )
		];
		config.externals = [ require( 'webpack-node-externals' )() ];
		config.output = {
			filename: 'build/test.js',
			path: __dirname
		};
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
