window.wp.blocks.register( {
	elements: [ 'ul', 'ol' ],
	type: 'text',
	icon: 'gridicons-list-unordered',
	buttons: [
		'bullist',
		'numlist',
		{
			icon: 'gridicons-posts',
			onClick: function( editor, element ) {
				editor.selection.select( element );

				if ( element.nodeName === 'UL' ) {
					editor.execCommand( 'InsertUnorderedList' );
				} else if ( element.nodeName === 'OL' ) {
					editor.execCommand( 'InsertOrderedList' );
				}

				editor.nodeChanged();
			}
		}
	]
} );
