window.wp.blocks.registerBlock( {
	elements: [ 'p' ],
	type: 'text',
	displayName: 'Paragraph',
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
			onClick: function( block, editor ) {
				editor.execCommand( 'InsertUnorderedList' );
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
	insert: function( block, editor ) {
		editor.formatter.apply( 'paragraph', block );
	}
} );
