window.wp.blocks.register( {
	elements: [ 'blockquote' ],
	type: 'text',
	icon: 'gridicons-quote',
	buttons: [
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

