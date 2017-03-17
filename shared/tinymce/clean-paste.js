( function( tinymce ) {
	tinymce.PluginManager.add( 'clean-paste', function( editor ) {
		// To do: remove pasted classes but keep when internally pasted.

		editor.on( 'BeforePastePreProcess', function( event ) {
			var content = event.content;

			// Remove all external styles
			content = content.replace( /(<[^>]+) style="[^"]*"([^>]*>)/gi, '$1$2' );

			// Keep internal styles
			content = content.replace( /(<[^>]+) data-mce-style="([^"]+)"([^>]*>)/gi, function( all, before, value, after ) {
				return before + ' style="' + value + '"' + after;
			} );

			event.content = content;
		} );
	} );
} )( window.tinymce );
