/**
 * External dependencies
 */
const { ConcatSource } = require( 'webpack-sources' );

module.exports = class LibraryExportDefaultPlugin {
	constructor( entryPointNames = [] ) {
		this.entryPointNames = entryPointNames;
	}

	apply( compiler ) {
		compiler.hooks.compilation.tap(
			'LibraryExportDefaultPlugin',
			( compilation ) => {
				const { mainTemplate, chunkTemplate } = compilation;

				const onRenderWithEntry = ( source, chunk ) => {
					if ( ! this.entryPointNames.includes( chunk.name ) ) {
						return source;
					}
					return new ConcatSource( source, '["default"]' );
				};

				for ( const template of [ mainTemplate, chunkTemplate ] ) {
					template.hooks.renderWithEntry.tap(
						'LibraryExportDefaultPlugin',
						onRenderWithEntry
					);
				}

				mainTemplate.hooks.hash.tap(
					'LibraryExportDefaultPlugin',
					( hash ) => {
						hash.update( 'export property' );
						hash.update( 'default' );
					}
				);
			}
		);
	}
};
