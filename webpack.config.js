/**
 * External dependencies
 */
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );

// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './[name]/build/style.css',
} );

// CSS loader for styles specific to block editing.
const editBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/build/edit-blocks.css',
} );

// CSS loader for styles specific to blocks in general.
const blocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/build/style.css',
} );

// Configuration for the ExtractTextPlugin.
const extractConfig = {
	use: [
		{ loader: 'raw-loader' },
		{
			loader: 'postcss-loader',
			options: {
				plugins: [
					require( 'autoprefixer' ),
				],
			},
		},
		{
			loader: 'sass-loader',
			query: {
				includePaths: [ 'editor/assets/stylesheets' ],
				data: '@import "colors"; @import "admin-schemes"; @import "breakpoints"; @import "variables"; @import "mixins"; @import "animations";@import "z-index";',
				outputStyle: 'production' === process.env.NODE_ENV ?
					'compressed' : 'nested',
			},
		},
	],
};

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

const packageNames = [
	'hooks',
];

const externals = {
	react: 'React',
	'react-dom': 'ReactDOM',
	'react-dom/server': 'ReactDOMServer',
	tinymce: 'tinymce',
	moment: 'moment',
	jquery: 'jQuery',
};

[ ...entryPointNames, ...packageNames ].forEach( name => {
	externals[ `@wordpress/${ name }` ] = {
		this: [ 'wp', name ],
	};
} );

const config = {
	entry: Object.assign(
		entryPointNames.reduce( ( memo, entryPointName ) => {
			memo[ entryPointName ] = `./${ entryPointName }/index.js`;
			return memo;
		}, {} ),
		packageNames.reduce( ( memo, packageName ) => {
			memo[ packageName ] = `./node_modules/@wordpress/${ packageName }`;
			return memo;
		}, {} )
	),
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
				test: /style\.s?css$/,
				include: [
					/blocks/,
				],
				use: blocksCSSPlugin.extract( extractConfig ),
			},
			{
				test: /editor\.s?css$/,
				include: [
					/blocks/,
				],
				use: editBlocksCSSPlugin.extract( extractConfig ),
			},
			{
				test: /\.s?css$/,
				exclude: [
					/blocks/,
				],
				use: mainCSSExtractTextPlugin.extract( extractConfig ),
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin( {
			'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV || 'development' ),
		} ),
		blocksCSSPlugin,
		editBlocksCSSPlugin,
		mainCSSExtractTextPlugin,
		// Create RTL files with a -rtl suffix
		new WebpackRTLPlugin( {
			suffix: '-rtl',
			minify: {
				safe: true,
			},
		} ),
		new webpack.LoaderOptionsPlugin( {
			minimize: process.env.NODE_ENV === 'production',
			debug: process.env.NODE_ENV !== 'production',
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

	default:
		config.devtool = 'source-map';
}

module.exports = config;
