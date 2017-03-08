window.wp.blocks.registerBlock( {
	name: 'list',
	displayName: 'List',
	elements: [ 'ul', 'ol' ],
	type: 'text',
	icon: 'gridicons-list-unordered',
	controls: [
		{
			icon: 'gridicons-list-unordered',
			stateSelector: 'ul',
			onClick: function( editor ) {
				editor.execCommand( 'InsertUnorderedList' );
			}
		},
		{
			icon: 'gridicons-list-ordered',
			stateSelector: 'ol',
			onClick: function( editor ) {
				editor.execCommand( 'InsertOrderedList' );
			}
		},
		{
			classes: 'remove-formatting',
			icon: 'gridicons-list-unordered',
			onClick: function( block, editor ) {
				if ( block.nodeName === 'UL' ) {
					editor.execCommand( 'InsertUnorderedList' );
				} else if ( block.nodeName === 'OL' ) {
					editor.execCommand( 'InsertOrderedList' );
				}
			}
		}
	],
	insert: function( block, editor ) {
		editor.execCommand( 'InsertUnorderedList' );
	}
} );
