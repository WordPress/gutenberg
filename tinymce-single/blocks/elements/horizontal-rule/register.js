window.wp.blocks.registerBlock( {
	elements: [ 'hr' ],
	type: 'separator',
	icon: 'gridicons-minus',
	insert: function( block ) {
		block.parentNode.replaceChild( document.createElement( 'hr' ), block );
	}
} );
