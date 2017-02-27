window.wp.blocks.register( {
	elements: [ 'ul', 'ol' ],
	type: 'text',
	icon: 'gridicons-list-unordered',
	buttons: [
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
			icon: 'gridicons-posts',
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
