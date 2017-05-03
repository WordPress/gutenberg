/**
 * External dependencies
 */

const glob = require( 'glob' );
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const ResolveEntryModulesPlugin = require( 'resolve-entry-modules-webpack-plugin' );

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
		'react-dom': 'ReactDOM',
		'react-dom/server': 'ReactDOMServer'
	},
	resolve: {
		alias: {
			// There are currently resolution errors on RSF's "mitt" dependency
			// when imported as native ES module
			'react-slot-fill': 'react-slot-fill/lib/rsf.js'
		}
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
								includePaths: [ 'editor/assets/stylesheets' ],
								data: '@import "variables"; @import "mixins"; @import "animations";',
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
		new ResolveEntryModulesPlugin(),
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
	],
	stats: {
		children: false
	}
};

switch ( process.env.NODE_ENV ) {
	case 'production':
		config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
		break;

	case 'test':
		config.target = 'node';
		config.module.rules = [
			...[ 'i18n', 'element', 'blocks', 'editor' ].map( ( entry ) => ( {
				test: require.resolve( './' + entry + '/index.js' ),
				use: 'expose-loader?wp.' + entry
			} ) ),
			...config.module.rules
		];
		config.entry = [
			'./i18n/index.js',
			'./element/index.js',
			'./blocks/index.js',
			'./editor/index.js',
			...glob.sync( `./{${ Object.keys( config.entry ).join() }}/**/test/*.js` )
		];
		config.externals = [ require( 'webpack-node-externals' )() ];
		config.output = {
			filename: 'build/test.js',
			path: __dirname
		};
		config.plugins.push( new webpack.ProvidePlugin( {
			tinymce: 'tinymce/tinymce',
		} ) );
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
