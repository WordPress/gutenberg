( function( wp ) {
	function insertEmpty() {
		return '<blockquote><p><br></p></blockquote>';
	}

	function fromBaseState( block, editor ) {
		editor.formatter.apply( 'blockquote', block );
	}

	function toBaseState( block ) {
		var footer = block.querySelector( 'footer' );
		var firstChild = block.firstChild;

		if ( footer ) {
			block.removeChild( footer );
		}

		while ( block.firstChild ) {
			block.parentNode.insertBefore( block.firstChild, block );
		}

		block.parentNode.removeChild( block );

		window.wp.blocks.selectBlock( firstChild );
	}

	window.wp.blocks.registerBlock( {
		name: 'blockquote',
		displayName: 'Quote',
		elements: [ 'blockquote' ],
		type: 'text',
		icon: 'gridicons-quote',
		restrictToInline: [ 'footer' ],
		controls: [
			{
				classes: 'remove-formatting',
				icon: 'gridicons-quote',
				onClick: toBaseState
			},
			{
				icon: 'gridicons-caption',
				onClick: function( block ) {
					var footer = block.querySelector( 'footer' );

					if ( footer ) {
						block.removeChild( footer );
					} else {
						block.insertAdjacentHTML( 'beforeend',
							'<footer><br></footer>' );
					}
				},
				isActive: function( block ) {
					return !! block.querySelector( 'footer' );
				}
			}
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState
	} );
} )( window.wp );
