window.wp.blocks.registerBlock( {
	name: 'list',
	displayName: 'List',
	elements: [ 'ul', 'ol' ],
	type: 'text',
	icon: 'gridicons-list-unordered',
	controls: [
		{
			icon: 'gridicons-list-unordered',
			stateSelector: 'ul',
			onClick: function( block, editor ) {
				// Use native command to toggle current selected list.
				editor.execCommand( 'InsertUnorderedList' );
			}
		},
		{
			icon: 'gridicons-list-ordered',
			stateSelector: 'ol',
			onClick: function( block, editor ) {
				// Use native command to toggle current selected list.
				editor.execCommand( 'InsertOrderedList' );
			}
		},
		{
			classes: 'remove-formatting',
			icon: 'gridicons-list-unordered',
			onClick: function( block, editor ) {
				var p = document.createElement( 'P' );

				function build( list, p ) {
					var item;

					while ( item = list.firstChild ) {
						if ( p.childNodes.length ) {
							p.appendChild( document.createElement( 'BR' ) );
						}

						while ( item.firstChild ) {
							if ( item.firstChild.nodeName === 'UL' || item.firstChild.nodeName === 'OL' ) {
								build( item.firstChild, p )
								item.removeChild( item.firstChild );
							} else {
								p.appendChild( item.firstChild );
							}
						}

						list.removeChild( item );
					}
				}

				build( block, p );

				block.parentNode.replaceChild( p, block );
			}
		}
	],
	insert: function() {
		return '<ul><li><br></li></ul>';
	}
} );
