window.wp.blocks.registerBlock( {
	name: 'paragraph',
	displayName: 'Paragraph',
	elements: [ 'p' ],
	type: 'text',
	icon: 'gridicons-posts',
	controls: [
		{
			icon: 'gridicons-heading',
			onClick: function( block, editor ) {
				editor.formatter.apply( 'h1' );
			}
		},
		{
			icon: 'gridicons-quote',
			onClick: function( block, editor ) {
				editor.formatter.apply( 'blockquote' );
			}
		},
		{
			icon: 'gridicons-list-unordered',
			onClick: function( block ) {
				wp.blocks.getBlockSettings( 'elements:list' ).fromBaseState( block );
			}
		},
		{
			icon: 'gridicons-code',
			onClick: function( block, editor ) {
				editor.formatter.apply( 'pre' );
			}
		},
		'text-align-left',
		'text-align-center',
		'text-align-right'
	],
	insert: function() {
		return '<p><br></p>';
	}
} );
