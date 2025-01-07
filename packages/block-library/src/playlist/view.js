/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store(
	'core/playlist',
	{
		state: {
			get currentTrack() {
				const { currentId } = getContext();
				return state.tracks[ currentId ];
			},
			get isCurrentTrack() {
				const { currentId, id } = getContext();
				return currentId === id;
			},
		},
		actions: {
			changeTrack() {
				const context = getContext();
				context.currentId = context.id;
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
			nextSong() {
				const context = getContext();
				const currentIndex = context.tracks.findIndex(
					( id ) => id === context.currentId
				);
				const nextTrack = context.tracks[ currentIndex + 1 ];
				if ( nextTrack ) {
					context.currentId = nextTrack;
					const { ref } = getElement();
					// Waits a momet before changing the track, since
					// immediately changing the track can be jarring.
					setTimeout( () => {
						ref.play();
					}, 1000 );
				}
			},
		},
		callbacks: {
			autoPlay() {
				const context = getContext();
				const { ref } = getElement();
				if ( context.currentId && context.isPlaying ) {
					ref.play();
				}
			},
		},
	},
	{ lock: true }
);
