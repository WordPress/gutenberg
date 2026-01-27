( ( { wp: { element, blocks, blockEditor } } ) => {
	const { createElement: el } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;

	registerBlockType( 'test/compat-mode-error-block', {
		edit: function Edit( { attributes } ) {
			// Intentionally throw an error to test error handling
			if ( attributes.shouldError !== false ) {
				throw new Error( 'Test error in compat mode block edit component' );
			}
			return el( 'div', useBlockProps(),
				el( 'p', null, 'Compat Mode Error Block (no error)' )
			);
		},
		save: function Save( { attributes } ) {
			return el( 'p', useBlockProps.save(), attributes.content );
		},
	} );
	console.log( '[Compat Mode Error Test Block] Registered!' );
} )( window );
