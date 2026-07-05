document
	.querySelectorAll( '.wp-block-embed__thumbnail-overlay' )
	.forEach( ( overlay ) => {
		// `@wordpress/i18n` has no script module build, and translation
		// functions aren't allowed in save.js, so this label can't be
		// translated in this context.
		overlay.setAttribute( 'aria-label', 'Play' );
		overlay.addEventListener( 'click', () => {
			// Auto-start playback so a single click both dismisses the
			// poster and plays the video, instead of leaving the user to
			// find the provider's own play button underneath.
			const iframe = overlay.parentElement?.querySelector( 'iframe' );
			if ( iframe?.src ) {
				try {
					const src = new URL( iframe.src );
					src.searchParams.set( 'autoplay', '1' );
					iframe.src = src.toString();
				} catch {
					// Malformed src: skip autoplay, still reveal the embed.
				}
			}
			overlay.remove();
		} );
	} );
