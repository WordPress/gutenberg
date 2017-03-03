window.wp.blocks.registerBlock( {
	elements: [ 'hr' ],
	type: 'separator',
	icon: 'gridicons-minus',
	insert: function( editor ) {
		var block = wp.blocks.getSelectedBlock( editor );

		block.parentNode.replaceChild( document.createElement( 'hr' ), block );
	}
} );
