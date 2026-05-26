( ( { wp: { element, blocks, blockEditor }, jQuery: $ } ) => {
	const { createElement: el, useCallback } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;

	registerBlockType( 'test/iframed-block', {
		apiVersion: 3,
		edit: function Edit() {
			const ref = useCallback( ( node ) => {
				if ( ! node ) {
					return;
				}
				$( node ).test();
			}, [] );
			return el( 'p', useBlockProps( { ref } ), 'Iframed Block (edit)' );
		},
		save: function Save() {
			return el( 'p', useBlockProps.save(), 'Iframed Block (saved)' );
		},
	} );
} )( window );
