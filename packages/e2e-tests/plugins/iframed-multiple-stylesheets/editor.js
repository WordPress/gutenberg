( ( { wp: { element, blocks, blockEditor } } ) => {
	const { createElement: el } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;

	registerBlockType( 'test/iframed-multiple-stylesheets', {
		apiVersion: 2,
		edit: function Edit() {
			return el( 'div', useBlockProps(), 'Edit' );
		},
		save: function Save() {
			return el( 'div', useBlockProps.save(), 'Save' );
		},
	} );
} )( window );
