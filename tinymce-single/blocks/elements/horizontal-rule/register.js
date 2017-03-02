window.wp.blocks.registerBlock( {
	elements: [ 'hr' ],
	type: 'separator',
	icon: 'gridicons-minus',
	insert: function( editor, element ) {
		element.parentNode.replaceChild( document.createElement( 'hr' ), element );
	}
} );
