window.wp.blocks.registerBlock( {
	elements: [ 'p' ],
	type: 'text',
	icon: 'gridicons-posts',
	controls: [
		{
			icon: 'gridicons-heading',
			onClick: function( editor ) {
				editor.formatter.apply( 'h1' );
			}
		},
		{
			icon: 'gridicons-quote',
			onClick: function( editor ) {
				editor.formatter.apply( 'blockquote' );
			}
		},
		{
			icon: 'gridicons-list-unordered',
			onClick: function( editor ) {
				editor.execCommand( 'InsertUnorderedList' );
			}
		},
		{
			icon: 'gridicons-code',
			onClick: function( editor ) {
				editor.formatter.apply( 'pre' );
			}
		},
		'text-align-left',
		'text-align-center',
		'text-align-right'
	]
} );
