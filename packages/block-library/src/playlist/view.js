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

		// Get the url from the button data attribute and change the current track.
		audio.src = button.getAttribute( 'data-playlist-track-url' );

		/*
		 * TODO:
		 * Get and set the image of the track. Remember that this feature can be disabled.
		 * Get and set the title of the track.
		 * Get and set the artist of the track.
		 * Get and set the album of the track.
		 * - Decide if these shold all be data attributes.
		 */

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
		// TODO: This will not work if the block hides the track list.
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
