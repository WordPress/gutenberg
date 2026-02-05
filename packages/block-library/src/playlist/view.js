/**
 * External dependencies
 */
import WaveformPlayer from '@arraypress/waveform-player';
import '@arraypress/waveform-player/dist/waveform-player.css';

/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	getWaveformColors,
	createWaveformContainer,
	styleSvgIcons,
} from './utils';

/**
 * Store player state for each element (instance, url, event listeners).
 */
const playerState = new Map();

const { state } = store(
	'core/playlist',
	{
		state: {
			playlists: {},
			get currentTrack() {
				const { currentId, playlistId } = getContext();
				if ( ! currentId || ! playlistId ) {
					return {};
				}
				const playlist = state.playlists[ playlistId ];
				if ( ! playlist ) {
					return {};
				}
				return playlist.tracks[ currentId ] || {};
			},
			get isCurrentTrack() {
				const { currentId, uniqueId } = getContext();
				return currentId === uniqueId;
			},
		},
		actions: {
			changeTrack() {
				const context = getContext();
				context.currentId = context.uniqueId;
				context.isPlaying = true;
			},
			isPlaying() {
				const context = getContext();
				context.isPlaying = true;
			},
			isPaused() {
				const context = getContext();
				context.isPlaying = false;
			},
			nextSong( event ) {
				const { ref } = getElement();

				// Check if this event is for this specific player instance.
				if ( event?.detail?.element && event.detail.element !== ref ) {
					return;
				}

				const context = getContext();
				const currentIndex = context.tracks.findIndex(
					( uniqueId ) => uniqueId === context.currentId
				);
				const nextTrack = context.tracks[ currentIndex + 1 ];
				if ( nextTrack ) {
					context.currentId = nextTrack;
					// Waits a moment before changing the track, since
					// immediately changing the track can be jarring.
					setTimeout( () => {
						const audio = ref.querySelector( 'audio' );
						if ( audio ) {
							audio.play();
						}
					}, 1000 );
				}
			},
		},
		callbacks: {
			initWaveformPlayer() {
				const context = getContext();
				const { ref } = getElement();

				if ( ! context.currentId || ! ref ) {
					return;
				}

				const track =
					state.playlists[ context.playlistId ]?.tracks[
						context.currentId
					];
				if ( ! track?.url ) {
					return;
				}

				const existing = playerState.get( ref );

				// Skip if we already initialized with this exact URL.
				if ( existing?.url === track.url ) {
					return;
				}

				// Clean up any existing player state.
				if ( existing ) {
					const {
						container,
						handlers,
						instance,
						playBtn,
						keyboardHandler,
					} = existing;
					if ( playBtn && keyboardHandler ) {
						playBtn.removeEventListener(
							'keydown',
							keyboardHandler
						);
					}
					if ( container && handlers ) {
						container.removeEventListener(
							'waveformplayer:ended',
							handlers.ended
						);
						container.removeEventListener(
							'waveformplayer:play',
							handlers.play
						);
						container.removeEventListener(
							'waveformplayer:pause',
							handlers.pause
						);
					}
					try {
						instance?.destroy();
					} catch ( e ) {
						// Silently ignore cleanup errors.
					}
					playerState.delete( ref );
				}

				// Clear any DOM elements from previous player.
				ref.innerHTML = '';

				// Remove the initialized flag so WaveformPlayer creates fresh.
				ref.removeAttribute( 'data-waveform-initialized' );

				// Get colors from computed styles for proper inheritance.
				const { textColor, bgColor, waveformColor, progressColor } =
					getWaveformColors( ref );

				// Create the waveform container.
				const container = createWaveformContainer( {
					url: track.url,
					title: track.title,
					artist: track.artist,
					artwork: track.image,
					waveformColor,
					progressColor,
					buttonColor: textColor,
				} );
				ref.appendChild( container );

				// Create WaveformPlayer instance.
				const instance = new WaveformPlayer( container );

				// Apply background color to SVG icons for contrast.
				styleSvgIcons( container, bgColor );

				// Enhance play button accessibility.
				const playBtn = container.querySelector( '.waveform-btn' );
				let keyboardHandler = null;
				if ( playBtn ) {
					playBtn.setAttribute(
						'aria-label',
						track.ariaLabel || track.title || 'Play'
					);
					playBtn.setAttribute( 'role', 'button' );

					// Add keyboard support for seeking.
					keyboardHandler = ( event ) => {
						const audio = container.querySelector( 'audio' );
						if ( ! audio ) {
							return;
						}

						const seekAmount = 5; // Seconds to seek.
						switch ( event.key ) {
							case 'ArrowLeft':
								event.preventDefault();
								audio.currentTime = Math.max(
									0,
									audio.currentTime - seekAmount
								);
								break;
							case 'ArrowRight':
								event.preventDefault();
								audio.currentTime = Math.min(
									audio.duration,
									audio.currentTime + seekAmount
								);
								break;
						}
					};

					playBtn.addEventListener( 'keydown', keyboardHandler );
				}

				// Create event handlers for WaveformPlayer events.
				const handleEnded = () => {
					ref.dispatchEvent(
						new CustomEvent( 'waveform-ended', {
							bubbles: true,
							detail: { element: ref },
						} )
					);
				};

				const handlePlay = () => {
					ref.dispatchEvent(
						new CustomEvent( 'waveform-play', {
							bubbles: true,
							detail: { element: ref },
						} )
					);
				};

				const handlePause = () => {
					ref.dispatchEvent(
						new CustomEvent( 'waveform-pause', {
							bubbles: true,
							detail: { element: ref },
						} )
					);
				};

				// Add event listeners.
				container.addEventListener(
					'waveformplayer:ended',
					handleEnded
				);
				container.addEventListener( 'waveformplayer:play', handlePlay );
				container.addEventListener(
					'waveformplayer:pause',
					handlePause
				);

				// Store all state for cleanup.
				playerState.set( ref, {
					url: track.url,
					instance,
					container,
					playBtn,
					keyboardHandler,
					handlers: {
						ended: handleEnded,
						play: handlePlay,
						pause: handlePause,
					},
				} );

				// Auto-play if the context says we should be playing.
				if ( context.isPlaying && instance ) {
					instance.play();
				}
			},
		},
	},
	{ lock: true }
);
