/**
 * External dependencies
 */
const { ConcatSource } = require( 'webpack-sources' );
const IgnoreEmitWebpackPlugin = require( 'ignore-emit-webpack-plugin' );

// This is a simple webpack plugin to merge the JS files generated for styles by
// MiniCssExtractPlugin into their corresponding entrypoints.
// Despited basically being noop files, they are required to get the real JS
// files to load, silently failing without them.
// @see https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
class FixStyleWebpackPlugin {
	constructor() {
		// Offload removing JS assets for styles the ExternalsPlugin.
		this.ignoreEmitPlugin = new IgnoreEmitWebpackPlugin( /style-(.*).js/ );
	}

	apply( compiler ) {
		compiler.hooks.compilation.tap(
			'FixStyleWebpackPlugin',
			( compilation ) => {
				compilation.hooks.optimizeChunkAssets.tap(
					'FixStyleWebpackPlugin',
					( chunks ) => {
						for ( const chunk of chunks ) {
							if ( ! chunk.canBeInitial() ) {
								continue;
							}

							const file = `${ chunk.name }.js`;
							const styleFile = chunk.name.replace(
								/(\/?)([^/]+?)$/,
								'$1style-$2.js'
							);
							const styleFileAsset = compilation.getAsset(
								styleFile
							);
							if ( ! styleFileAsset ) {
								continue;
							}
							compilation.updateAsset( file, ( oldSource ) => {
								return new ConcatSource(
									styleFileAsset.source.source() + '\n\n',
									oldSource
								);
							} );
						}
					}
				);
			}
		);

		this.ignoreEmitPlugin.apply( compiler );
	}
}

module.exports = FixStyleWebpackPlugin;
