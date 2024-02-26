( ( { wp: { element, blocks, blockEditor } } ) => {
	const { createElement: el } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;

	registerBlockType( 'test/iframed-inline-styles', {
		apiVersion: 3,
		edit: function Edit() {
			return el( 'div', useBlockProps(), 'Edit' );
		},
		save: function Save() {
			return el( 'div', useBlockProps.save(), 'Save' );
		},
	} );
} )( window );
