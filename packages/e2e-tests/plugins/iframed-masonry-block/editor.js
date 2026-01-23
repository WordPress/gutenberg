( ( { wp: { element, blocks, blockEditor, compose } } ) => {
	const { createElement: el } = element;
	const { registerBlockType } = blocks;
	const { useBlockProps } = blockEditor;
	const { useRefEffect } = compose;

	const content = [
		el( 'div', { className: 'grid-item' } ),
		el( 'div', {
			className: 'grid-item grid-item--width2 grid-item--height2',
		} ),
		el( 'div', { className: 'grid-item grid-item--height3' } ),
		el( 'div', { className: 'grid-item grid-item--height2' } ),
		el( 'div', { className: 'grid-item grid-item--width3' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item grid-item--height2' } ),
		el( 'div', {
			className: 'grid-item grid-item--width2 grid-item--height3',
		} ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item grid-item--height2' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', {
			className: 'grid-item grid-item--width2 grid-item--height2',
		} ),
		el( 'div', { className: 'grid-item grid-item--width2' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item grid-item--height2' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item grid-item--height3' } ),
		el( 'div', { className: 'grid-item grid-item--height2' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item' } ),
		el( 'div', { className: 'grid-item grid-item--height2' } ),
	];

	registerBlockType( 'test/iframed-masonry-block', {
		apiVersion: 3,
		edit: function Edit() {
			const ref = useRefEffect( ( node ) => {
				const { ownerDocument } = node;
				const { defaultView } = ownerDocument;

				if ( ! defaultView.Masonry ) {
					return;
				}

				const masonry = new defaultView.Masonry( node, {
					itemSelector: '.grid-item',
				} );

				return () => {
					masonry.destroy();
				};
			} );
			return el( 'div', useBlockProps( { ref } ), ...content );
		},
		save: function Save() {
			return el( 'div', useBlockProps.save(), ...content );
		},
	} );
} )( window );
