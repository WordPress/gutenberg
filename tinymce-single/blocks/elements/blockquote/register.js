window.wp.blocks.registerBlock( {
	elements: [ 'blockquote' ],
	type: 'text',
	icon: 'gridicons-quote',
	controls: [
		{
			classes: 'remove-formatting',
			icon: 'gridicons-quote',
			onClick: function( editor ) {
				editor.formatter.remove( 'blockquote' );
			}
		}
	],
	insert: function( editor, element ) {
		editor.formatter.apply( 'blockquote', element );
	}
} );

