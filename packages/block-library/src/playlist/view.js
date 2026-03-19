/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	TRACK_CHANGE_DELAY_MS,
	getPlayerWaveSurferConfig,
	getHoverWaveSurferConfig,
} from './wavesurfer-utils';

// Get WaveSurfer from window - it will be loaded via wp_enqueue_script
const getWaveSurfer = () => window.WaveSurfer;

const { state } = store( 'core/playlist', {
	state: {
		playlists: {},
		players: {},
		get currentTrack() {
			const { currentId, playlistId } = getContext();
			if ( ! currentId || ! playlistId ) {
				return {};
			}
			const playlist = this.playlists[ playlistId ];
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
		togglePlayPause() {
			const context = getContext();
			const player = state.players[ context.playlistId ];
			if ( player ) {
				player.playPause();
			}
		},
		nextSong() {
			const context = getContext();
			const currentIndex = context.tracks.findIndex(
				( uniqueId ) => uniqueId === context.currentId
			);
			const nextTrack = context.tracks[ currentIndex + 1 ];
			if ( nextTrack ) {
				context.currentId = nextTrack;
				const player = state.players[ context.playlistId ];
				// Waits a moment before changing the track, since
				// immediately changing the track can be jarring.
				setTimeout( () => {
					if ( player ) {
						player.play();
					}
				}, TRACK_CHANGE_DELAY_MS );
			}
		},
	},
	callbacks: {
		initWaveSurfer() {
			const context = getContext();

			// Only initialize if not already done
			if ( state.players[ context.playlistId ] ) {
				return;
			}

			const WaveSurfer = getWaveSurfer();
			if ( ! WaveSurfer ) {
				// eslint-disable-next-line no-console
				console.error( 'WaveSurfer is not loaded' );
				return;
			}

			const { ref } = getElement();

			// Get the computed colors from the container
			const containerStyles = window.getComputedStyle( ref );
			const color = containerStyles.getPropertyValue( 'color' );

			// Get background color - try CSS custom property first, then computed style
			// Fall back to traversing up the DOM to find non-transparent background
			let backgroundColor =
				containerStyles.getPropertyValue(
					'--wp--preset--color--base'
				) || containerStyles.getPropertyValue( 'background-color' );

			// If background is transparent, traverse up to find actual background
			if (
				! backgroundColor ||
				backgroundColor === 'transparent' ||
				backgroundColor === 'rgba(0, 0, 0, 0)'
			) {
				let element = ref.parentElement;
				while ( element ) {
					const bgColor =
						window.getComputedStyle( element ).backgroundColor;
					if (
						bgColor &&
						bgColor !== 'transparent' &&
						bgColor !== 'rgba(0, 0, 0, 0)'
					) {
						backgroundColor = bgColor;
						break;
					}
					element = element.parentElement;
				}
			}

			// Create progress background layer (solid color behind played portion)
			const progressBg = document.createElement( 'div' );
			progressBg.className = 'wp-block-playlist__waveform-progress';
			ref.appendChild( progressBg );

			// Create container for the base waveform (reduced opacity)
			const baseContainer = document.createElement( 'div' );
			baseContainer.className = 'wp-block-playlist__waveform-base';
			ref.appendChild( baseContainer );

			// Create container for the hover waveform (full opacity)
			const hoverContainer = document.createElement( 'div' );
			hoverContainer.className = 'wp-block-playlist__waveform-hover';
			ref.appendChild( hoverContainer );

			// Create base waveform (reduced opacity bars, shows progress)
			const wavesurfer = WaveSurfer.create(
				getPlayerWaveSurferConfig(
					baseContainer,
					color,
					backgroundColor
				)
			);

			// Create hover waveform (full opacity bars, no cursor)
			const hoverWavesurfer = WaveSurfer.create(
				getHoverWaveSurferConfig(
					hoverContainer,
					color,
					backgroundColor
				)
			);

			state.players[ context.playlistId ] = wavesurfer;
			state.players[ context.playlistId + '-hover' ] = hoverWavesurfer;

			// Handle hover events to show/hide the hover waveform
			const handleMouseLeave = () => {
				hoverContainer.style.clipPath = 'inset(0 100% 0 0)';
			};
			const handleMouseMove = ( event ) => {
				const rect = ref.getBoundingClientRect();
				const hoverProgress =
					( ( event.clientX - rect.left ) / rect.width ) * 100;
				const clipRight =
					100 - Math.max( 0, Math.min( 100, hoverProgress ) );
				hoverContainer.style.clipPath = `inset(0 ${ clipRight }% 0 0)`;
			};

			ref.addEventListener( 'mouseleave', handleMouseLeave );
			ref.addEventListener( 'mousemove', handleMouseMove );

			// Wire up WaveSurfer events to Interactivity API
			wavesurfer.on( 'play', () => {
				context.isPlaying = true;
			} );

			wavesurfer.on( 'pause', () => {
				context.isPlaying = false;
			} );

			// Update progress background on timeupdate
			wavesurfer.on( 'timeupdate', ( currentTime ) => {
				const duration = wavesurfer.getDuration();
				if ( duration > 0 ) {
					const progress = ( currentTime / duration ) * 100;
					progressBg.style.width = `${ progress }%`;
				}
			} );

			// Reset progress background when seeking
			wavesurfer.on( 'seeking', ( progress ) => {
				progressBg.style.width = `${ progress * 100 }%`;
			} );

			wavesurfer.on( 'finish', () => {
				// Reset progress background
				progressBg.style.width = '0%';
				// Trigger next song
				const currentIndex = context.tracks.findIndex(
					( uniqueId ) => uniqueId === context.currentId
				);
				const nextTrack = context.tracks[ currentIndex + 1 ];
				if ( nextTrack ) {
					context.currentId = nextTrack;
					setTimeout( () => {
						wavesurfer.play();
					}, TRACK_CHANGE_DELAY_MS );
				}
			} );

			// Cleanup function for when the element is removed
			return () => {
				ref.removeEventListener( 'mouseleave', handleMouseLeave );
				ref.removeEventListener( 'mousemove', handleMouseMove );
				wavesurfer.destroy();
				hoverWavesurfer.destroy();
				delete state.players[ context.playlistId ];
				delete state.players[ context.playlistId + '-hover' ];
			};
		},
		loadTrack() {
			const context = getContext();
			const player = state.players[ context.playlistId ];
			const hoverPlayer = state.players[ context.playlistId + '-hover' ];
			const trackUrl = state.currentTrack.url;

			if ( player && trackUrl ) {
				player.load( trackUrl );
			}
			if ( hoverPlayer && trackUrl ) {
				hoverPlayer.load( trackUrl );
			}
		},
		autoPlay() {
			const context = getContext();
			const player = state.players[ context.playlistId ];
			if ( context.currentId && context.isPlaying && player ) {
				player.play();
			}
		},
	},
} );
