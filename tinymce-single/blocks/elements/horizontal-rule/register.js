window.wp.blocks.registerBlock( {
	name: 'hortizontal-rule',
	displayName: 'Horizontal Rule',
	elements: [ 'hr' ],
	type: 'separator',
	icon: 'gridicons-minus',
	insert: function( block ) {
		block.parentNode.replaceChild( document.createElement( 'hr' ), block );
	}
} );
