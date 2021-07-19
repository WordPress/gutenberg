( ( { wp: { element, blocks, blockEditor, compose }, jQuery: $ } ) => {
	const { createElement: el } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;
	const { useRefEffect } = compose;

	registerBlockType( 'test/iframed-block', {
		edit: function Edit() {
			const ref = useRefEffect( ( node ) => {
				$( node ).test();
			}, [] );
			return el( 'p', useBlockProps( { ref } ), 'Iframed Block (edit)' );
		},
		save: function Save() {
			return el( 'p', useBlockProps.save(), 'Iframed Block (saved)' );
		},
	} );
} )( window );
