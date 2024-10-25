/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store(
	'core/playlist',
	{
		actions: {
			changeTrack() {
				const context = getContext();
				const { ref } = getElement();
				const id = context.trackID;
				const src = context.trackURL;
				const title = context.trackTitle;
				const artist = context.trackArtist;
				const album = context.trackAlbum;
				const image = context.trackImageSrc;

				/*
				 * Since we are changing the track, we need to remove aria-current from the buttons,
				 * and re-add it to the button that was clicked.
				 */
				if ( ref ) {
					const trackListButtons = ref
						.closest( '.wp-block-playlist' )
						.querySelectorAll( '.wp-block-playlist__item button' );

					trackListButtons.forEach( ( buttons ) => {
						buttons.removeAttribute( 'aria-current' );
					} );

					ref.setAttribute( 'aria-current', 'true' );
				}

				if ( id ) {
					state.currentID = id;
				}
				if ( src ) {
					state.currentURL = src;
				}
				if ( title ) {
					state.currentTitle = title;
				}
				if ( artist ) {
					state.currentArtist = artist;
				}
				if ( album ) {
					state.currentAlbum = album;
				}
				if ( image ) {
					state.currentImage = image;
				}

				/**
				 * Find the audio element and play the selected track.
				 */
				const audio = ref
					.closest( '.wp-block-playlist' )
					.querySelector( 'audio' );
				if ( audio ) {
					// Wait a momet before changing the track, since immediately changing the track can be jarring.
					setTimeout( () => {
						audio.load();
						audio.play();
					}, 1000 );
				}
			},
		},
		callbacks: {
			init() {
				const { ref } = getElement();
				const audio = ref
					.closest( '.wp-block-playlist' )
					.querySelector( 'audio' );

				if ( audio ) {
					audio.addEventListener( 'ended', () => {
						const currentTrackListItem = ref
							.closest( '.wp-block-playlist' )
							.querySelector(
								'.wp-block-playlist__item button[aria-current="true"]'
							)
							?.closest( '.wp-block-playlist__item' );

						if ( currentTrackListItem ) {
							const nextTrackListItem =
								currentTrackListItem.nextElementSibling;
							if ( nextTrackListItem !== null ) {
								const nextTrackButton =
									nextTrackListItem.querySelector( 'button' );
								if ( nextTrackButton ) {
									// Wait a momet before changing the track, since immediately changing the track can be jarring.
									setTimeout( () => {
										nextTrackButton.click();
									}, 1000 );
								}
							}
						}
					} );
				}
			},
		},
	},
	{ lock: true }
);
