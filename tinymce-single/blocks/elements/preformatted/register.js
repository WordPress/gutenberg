window.wp.blocks.register( {
	elements: [ 'pre' ],
	type: 'text',
	icon: 'gridicons-code',
	buttons: [
		{
			text: 'syntax'
		},
		{
			icon: 'gridicons-posts',
			onClick: function( editor ) {
				editor.formatter.remove( 'pre' );
			}
		}
	]
} );
