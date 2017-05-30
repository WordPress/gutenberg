const attributes = [ 'id', 'class', 'style' ];

export default function( { editor, insertBlocksAfter } ) {
	// Strip out unwanted attributes.
	editor.on( 'BeforePastePreProcess', ( event ) => {
		if ( event.internal ) {
			return;
		}

		attributes.forEach( attribute => {
			const regExp = new RegExp( '(<[^>]+) ' + attribute + '="[^"]*"([^>]*>)', 'gi' );
			event.content = event.content.replace( regExp, ( match, $1, $2 ) => $1 + $2 );
		} );
	} );

	// Let inline content be pasted inline a block.
	// Block content should be parsed and inserted as blocks.
	editor.on( 'PastePostProcess', ( event ) => {
		const { node, internal } = event;

		if ( internal ) {
			return;
		}

		if ( Array.from( node.childNodes ).some( editor.dom.isBlock ) ) {
			if ( insertBlocksAfter ) {
				const blocks = wp.blocks.parse( node.innerHTML );
				insertBlocksAfter( blocks );
			}

			event.preventDefault();
		}
	} );
}
