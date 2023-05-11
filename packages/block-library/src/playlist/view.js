window.addEventListener( 'load', () => {
	/*
	 * There may be multiple playlists on the page, so we need to find them all
	 * and make sure the click events trigger on the correct playlist.
	 */
	const playlists = document.querySelectorAll( '.wp-block-playlist' );

	function changeTrack( event ) {
		// Find the closest button element, to make sure we are not targeting the span inside the button.
		const button = event.target.closest( 'button' );
		if ( ! button ) {
			return;
		}
		// Find the playlist block that is closest to the clicked button.
		const playlist = button.closest( '.wp-block-playlist' );
		if ( ! playlist ) {
			return;
		}

		// Find the audio element inside the playlist.
		const audio = playlist.querySelector( 'audio' );
		// Get the url from the button data attribute and change the current track.
		audio.src = button.getAttribute( 'data-playlist-track-url' );

		/*
		 * Since we are changing the track, we need to remove aria-current from the buttons,
		 * and re-add it to the button that was clicked.
		 */
		const trackListButtons = playlist.querySelectorAll(
			'.wp-block-playlist__item button'
		);
		trackListButtons.forEach( ( buttons ) => {
			buttons.removeAttribute( 'aria-current' );
		} );
		button.setAttribute( 'aria-current', 'true' );

		const image = playlist.querySelector( 'img' );
		/* The image is optional, check if it exists before changing it. */
		if ( image ) {
			image.src = button.getAttribute( 'data-playlist-track-image-src' );
		}

		const title = playlist.querySelector(
			'.wp-block-playlist__item-title'
		);
		title.innerHTML = button.getAttribute( 'data-playlist-track-title' );

		const artist = playlist.querySelector(
			'.wp-block-playlist__item-artist'
		);
		artist.innerHTML = button.getAttribute( 'data-playlist-track-artist' );

		const album = playlist.querySelector(
			'.wp-block-playlist__item-album'
		);
		album.innerHTML = button.getAttribute( 'data-playlist-track-album' );

		// Finally, play the selected track.
		audio.play();
	}

	function onTrackEnd( audio ) {
		// Find the playlist block that is closest to the audio element.
		const playlist = audio.closest( '.wp-block-playlist' );
		if ( ! playlist ) {
			return;
		}

		// Find the next track button.
		const nextTrackButton = playlist
			.querySelector(
				'.wp-block-playlist__item button[aria-current="true"]'
			)
			.closest( '.wp-block-playlist__item' ).nextElementSibling;

		// If there is a next track button, click it.
		if ( nextTrackButton ) {
			nextTrackButton.querySelector( 'button' ).click();
		}
	}

	playlists.forEach( ( playlist ) => {
		const trackListButtons = playlist.querySelectorAll(
			'.wp-block-playlist__item button'
		);
		const audio = playlist.querySelector( 'audio' );
		audio.addEventListener( 'ended', () => onTrackEnd( audio ) );

		trackListButtons.forEach( function ( button ) {
			button.addEventListener( 'click', changeTrack );
		} );
	} );
} );
