( function( wp ) {

	function insertEmpty() {
		return '<section><p><br></p></section>';
	}

	function fromBaseState( block, editor ) {
		var section = document.createElement( 'section' );

		section.setAttribute( 'data-wp-block-type', 'my-awesome-plugin:custom-blue-box' );

		block.parentNode.insertBefore( section, block );

		section.appendChild( block );
	}

	function toBaseState( block ) {
		var firstChild = block.firstChild;

		while ( block.firstChild ) {
			block.parentNode.insertBefore( block.firstChild, block );
		}

		block.parentNode.removeChild( block );

		wp.blocks.selectBlock( firstChild );
	}

	wp.blocks.registerBlock( {
		name: 'custom-blue-box',
		namespace: 'my-awesome-plugin',
		displayName: 'Custom Box',
		icon: 'gridicons-custom-post-type',
		type: 'text',
		editable: true,
		placeholders: {
			'p:first': 'Write in the magic box! ✨'
		},
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState,
		controls: [
			{
				classes: 'remove-formatting',
				icon: 'gridicons-custom-post-type',
				onClick: toBaseState
			},
			'|',
			'text-align-left',
			'text-align-center',
			'text-align-right'
		]
	} );

} )( window.wp );
