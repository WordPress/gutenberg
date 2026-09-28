const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	optimization: {
		minimize: false,
		chunkIds: 'named',
		moduleIds: 'named',
		splitChunks: {
			cacheGroups: {
				style: {
					type: 'css/mini-extract',
					test: /[\\/]style\.css$/,
					chunks: 'all',
					enforce: true,
					name( _, chunks, cacheGroupKey ) {
						return `${ cacheGroupKey }-${ chunks[ 0 ].name }`;
					},
				},
				default: false,
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					{
						loader: MiniCSSExtractPlugin.loader,
					},
					{
						loader: require.resolve( 'css-loader' ),
					},
				],
			},
		],
	},
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			requestToExternalModule( request ) {
				return request.startsWith( '@wordpress/' );
			},
		} ),
		new MiniCSSExtractPlugin(),
	],
};
