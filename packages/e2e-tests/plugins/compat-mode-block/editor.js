( ( { wp: { element, blocks, blockEditor } } ) => {
	const { createElement: el } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;

	registerBlockType( 'test/compat-mode-block', {
		edit: function Edit( { attributes } ) {
			return el( 'div', useBlockProps(),
				el( 'p', null, 'Compat Mode Block: ' + ( attributes.content || 'empty' ) )
			);
		},
		save: function Save( { attributes } ) {
			return el( 'p', useBlockProps.save(), attributes.content );
		},
	} );
	console.log( '[Compat Mode Test Block] Registered!' );
} )( window );
