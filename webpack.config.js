/**
 * External dependencies
 */

const path = require( 'path' );
const glob = require( 'glob' );
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

/**
 * Webpack plugin that adds the containing directory of each entry point as an
 * effective `resolve.modules` root for all module resolution within that path.
 */
class EntryResolvePlugin {
	apply( compiler ) {
		// Map entries into array of absolute paths
		const entryRoots = Object.keys( compiler.options.entry ).map( ( entry ) => {
			return path.dirname( path.resolve( compiler.options.entry[ entry ] ) );
		} );

		compiler.plugin( 'after-resolvers', () => {
			compiler.resolvers.normal.apply( {
				apply( resolver ) {
					resolver.plugin( 'module', ( request, callback ) => {
						// Find entry root which contains the requesting path
						const resolvePath = entryRoots.find( ( entryRoot ) => {
							return request.path.startsWith( entryRoot );
						} );

						if ( ! resolvePath ) {
							return callback();
						}

						// Add entry root as resolve base path
						resolver.doResolve( 'resolve', Object.assign( {}, request, {
							path: resolvePath,
							request: './' + request.request
						} ), '', callback );
					} );
				}
			} );
		} );
	}
}

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
								includePaths: [ 'editor/assets/stylesheets' ],
								data: '@import "variables";',
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
		new EntryResolvePlugin(),
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
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
