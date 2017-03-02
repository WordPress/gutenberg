window.wp.blocks.registerBlock( {
	elements: [ 'ul', 'ol' ],
	type: 'text',
	icon: 'gridicons-list-unordered',
	controls: [
		{
			icon: 'gridicons-list-unordered',
			stateSelector: 'ul',
			onClick: function( editor, element ) {
				editor.execCommand( 'InsertUnorderedList' );
			}
		},
		{
			icon: 'gridicons-list-ordered',
			stateSelector: 'ol',
			onClick: function( editor, element ) {
				editor.execCommand( 'InsertOrderedList' );
			}
		},
		{
			classes: 'remove-formatting',
			icon: 'gridicons-list-unordered',
			onClick: function( editor, element ) {
				if ( element.nodeName === 'UL' ) {
					editor.execCommand( 'InsertUnorderedList' );
				} else if ( element.nodeName === 'OL' ) {
					editor.execCommand( 'InsertOrderedList' );
				}
			}
		}
	]
} );
