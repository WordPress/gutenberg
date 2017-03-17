window.tinymce.PluginManager.add( 'wp:blocks:paste:external', function( editor ) {
	editor.on( 'BeforePastePreProcess', function( event ) {
		if ( event.internal ) {
			return;
		}

		[ 'id', 'class', 'style' ].forEach( function( attribute ) {
			event.content = event.content.replace(
				new RegExp( '(<[^>]+) ' + attribute + '="[^"]*"([^>]*>)', 'gi' ),
				'$1$2'
			);
		} );
	} );
} );
