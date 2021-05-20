/**
 * External dependencies
 */
const TerserPlugin = require( 'terser-webpack-plugin' );

//@todo Name needs to change because this also minimizes the files
class AddReadableJsAssetsWebpackPlugin {
	constructor( { mode } ) {
		this.terserPlugin = new TerserPlugin( {
			test: /\.min\.js$/,
			cache: true,
			parallel: true,
			sourceMap: mode !== 'production',
			terserOptions: {
				output: {
					comments: /translators:/i,
				},
				compress: {
					passes: 2,
				},
				mangle: {
					reserved: [ '__', '_n', '_nx', '_x' ],
				},
			},
			extractComments: false,
		} );
	}
	apply( compiler ) {
		// For some reason, webpack still includes the terser minifier even after I
		// removed it from the main webpack.config.js, not sure where it's
		// coming from, so as a temporary hack until I find out, I forcedly remove it
		compiler.options.optimization.minimizer = [];
		compiler.hooks.emit.tap( this.constructor.name, ( compilation ) => {
			const readableJsAssets = Object.keys( compilation.assets )
				.filter( ( assetPath ) => assetPath.match( /\.min.js$/ ) )
				.reduce( ( acc, assetPath ) => {
					acc[ assetPath.replace( /\.min/, '' ) ] =
						compilation.assets[ assetPath ];
					return acc;
				}, {} );

			if ( compiler.options.optimization.minimize ) {
				// This doesn't work :(. I guess because we're already too late
				// in the hooks flow and terser doesn't have a chance to when it
				// sets up its hook "taps".
				this.terserPlugin.apply( compiler );
			}

			compilation.assets = { ...compilation.assets, ...readableJsAssets };
		} );
	}
}

module.exports = AddReadableJsAssetsWebpackPlugin;
