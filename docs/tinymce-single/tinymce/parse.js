window.tinymce.PluginManager.add( 'wp:blocks:parse', function( editor ) {
	editor.on( 'preinit', function() {
		editor.parser.addNodeFilter( '#comment', function( comments ) {
			comments.forEach( function( comment ) {
				var value = comment.value.trim();

				if ( value === '/wp' ) {
					comment.remove();
					return;
				}

				var namespace;
				var name;
				var attributes = {};

				value.split( /\s+/ ).forEach( function( piece, i ) {
					var pair = piece.split( ':' );

					if ( ! pair.length === 2 ) {
						return;
					}

					if ( i === 0 ) {
						namespace = pair[ 0 ];
						name = pair[ 1 ];
					} else {
						attributes[ pair[ 0 ] ] = pair[ 1 ];
					}
				} );

				if ( ! namespace || ! name ) {
					return;
				}

				var next = comment.next;
				var settings = wp.blocks.getBlockSettings( namespace + ':' + name );

				if ( next.type === 1 && ! ( settings && settings.elements ) ) {
					next.attr( 'data-wp-block-type', namespace + ':' + name );

					if ( next.name === 'p' && next.firstChild &&
						next.firstChild === next.lastChild &&
						! editor.schema.getBlockElements()[ next.firstChild ] ) {
						next.name = 'figure';
					}
				}

				comment.remove();
			} );
		} );
	} );
} );
