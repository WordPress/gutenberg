window.wp.blocks.registerBlock( {
	name: 'blockquote',
	displayName: 'Quote',
	elements: [ 'blockquote' ],
	type: 'text',
	icon: 'gridicons-quote',
	controls: [
		{
			classes: 'remove-formatting',
			icon: 'gridicons-quote',
			onClick: function( block, editor ) {
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
	insert: function() {
		return '<blockquote><p><br></p></blockquote>';
	}
} );

