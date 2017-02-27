window.wp.blocks.register( {
	elements: [ 'blockquote' ],
	type: 'text',
	icon: 'gridicons-quote',
	buttons: [
		{
			icon: 'gridicons-posts',
			onClick: function( editor ) {
				editor.formatter.remove( 'blockquote' );
			}
		}
	]
} );

