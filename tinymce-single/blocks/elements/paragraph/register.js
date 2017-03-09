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
			onClick: function( block, editor ) {
				var list = document.createElement( 'UL' );
				var item = document.createElement( 'LI' );

				list.appendChild( item );

				while ( block.firstChild ) {
					if ( block.firstChild.nodeName === 'BR' ) {
						item = document.createElement( 'LI' );
						list.appendChild( item );
						block.removeChild( block.firstChild );
					} else {
						item.appendChild( block.firstChild );
					}
				}

				block.parentNode.replaceChild( list, block );
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
