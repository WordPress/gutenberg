window.wp.blocks.registerBlock( {
	elements: [ 'hr' ],
	type: 'separator',
	icon: 'gridicons-minus',
	buttons: [

	],
	insert: function( editor, element ) {
		element.parentNode.replaceChild( document.createElement( 'hr' ), element );
	}
} );
