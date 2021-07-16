/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

class AddReadableJsAssetsWebpackPlugin {
	extractUnminifiedFiles( compilation ) {
		const files = compilation.chunks.flatMap( ( chunk ) => chunk.files );
		compilation.unminifiedAssets = files.map( ( file ) => {
			const asset = compilation.assets[ file ];
			const unminifiedFile = file.replace( /\.min\.js$/, '.js' );
			return [ unminifiedFile, asset.source() ];
		} );
	}
	async writeUnminifiedFiles( compilation ) {
		for ( const [ file, source ] of compilation.unminifiedAssets ) {
			await fs.promises.writeFile(
				path.join( compilation.options.output.path, file ),
				source
			);
		}
	}
	apply( compiler ) {
		compiler.hooks.compilation.tap(
			this.constructor.name,
			( compilation ) => {
				compilation.hooks.additionalAssets.tap(
					this.constructor.name,
					() => this.extractUnminifiedFiles( compilation )
				);
			}
		);
		compiler.hooks.afterEmit.tapPromise(
			this.constructor.name,
			( compilation ) => this.writeUnminifiedFiles( compilation )
		);
	}
}

module.exports = AddReadableJsAssetsWebpackPlugin;
