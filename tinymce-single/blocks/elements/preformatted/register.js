window.wp.blocks.registerBlock( {
	name: 'preformatted',
	displayName: 'Preformatted',
	elements: [ 'pre' ],
	type: 'text',
	icon: 'gridicons-code',
	controls: [
		{
			icon: 'gridicons-cog'
		},
		{
			classes: 'remove-formatting',
			icon: 'gridicons-code',
			onClick: function( block, editor ) {
				editor.formatter.remove( 'pre' );
			}
		}
	],
	insert: function( block, editor ) {
		editor.formatter.apply( 'pre' );
	}
} );
