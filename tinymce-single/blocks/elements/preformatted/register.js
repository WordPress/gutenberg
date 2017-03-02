window.wp.blocks.register( {
	elements: [ 'pre' ],
	type: 'text',
	icon: 'gridicons-code',
	buttons: [
		{
			icon: 'gridicons-cog'
		},
		{
			classes: 'remove-formatting',
			icon: 'gridicons-code',
			onClick: function( editor ) {
				editor.formatter.remove( 'pre' );
			}
		}
	]
} );
