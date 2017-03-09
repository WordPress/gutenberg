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
				editor.formatter.remove( 'blockquote' );
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
						'<footer contenteditable="false">— <cite contenteditable="true"></cite></footer>' );
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

