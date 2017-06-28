/**
 * External dependencies
 */

const glob = require( 'glob' );
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

const entryPointNames = [
	'element',
	'i18n',
	'components',
	'utils',
	'blocks',
	'date',
	'editor',
];

const externals = {
	react: 'React',
	'react-dom': 'ReactDOM',
	'react-dom/server': 'ReactDOMServer',
	tinymce: 'tinymce',
	moment: 'moment',
};

entryPointNames.forEach( entryPointName => {
	externals[ entryPointName ] = {
		'this': [ 'wp', entryPointName ],
	};
} );

const config = {
	entry: entryPointNames.reduce( ( memo, entryPointName ) => {
		memo[ entryPointName ] = './' + entryPointName + '/index.js';
		return memo;
	}, {} ),
	output: {
		filename: '[name]/build/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},
	externals,
	resolve: {
		modules: [
			__dirname,
			'node_modules',
		],
		alias: {
			// There are currently resolution errors on RSF's "mitt" dependency
			// when imported as native ES module
			'react-slot-fill': 'react-slot-fill/lib/rsf.js',
		},
	},
	module: {
		rules: [
			{
				test: /\.pegjs/,
				use: 'pegjs-loader',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: 'babel-loader',
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
								data: '@import "variables"; @import "mixins"; @import "animations";@import "z-index";',
								outputStyle: 'production' === process.env.NODE_ENV ?
									'compressed' : 'nested',
							},
						},
					],
				} ),
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin( {
			'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV || 'development' ),
		} ),
		new ExtractTextPlugin( {
			filename: './[name]/build/style.css',
		} ),
		new webpack.LoaderOptionsPlugin( {
			minimize: process.env.NODE_ENV === 'production',
			debug: process.env.NODE_ENV !== 'production',
			options: {
				postcss: [
					require( 'autoprefixer' ),
				],
			},
		} ),
	],
	stats: {
		children: false,
	},
};

switch ( process.env.NODE_ENV ) {
	case 'production':
		config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
		break;

	case 'test':
		config.target = 'node';
		config.node = {
			__dirname: true,
		};
		config.module.rules = [
			...entryPointNames.map( ( entry ) => ( {
				test: require.resolve( './' + entry + '/index.js' ),
				use: 'expose-loader?wp.' + entry,
			} ) ),
			...config.module.rules,
		];
		const testFiles = glob.sync(
			'./{' + Object.keys( config.entry ).sort() + '}/**/test/*.js'
		);
		config.entry = [
			...entryPointNames.map(
				entryPointName => './' + entryPointName + '/index.js'
			),
			...testFiles.filter( f => /full-content\.js$/.test( f ) ),
			...testFiles.filter( f => ! /full-content\.js$/.test( f ) ),
		];
		config.externals = [ require( 'webpack-node-externals' )() ];
		config.output = {
			filename: 'build/test.js',
			path: __dirname,
		};
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
