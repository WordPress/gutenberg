import { store, getElement } from '@wordpress/interactivity';

/**
 * Playback for the Video block's Live photo variation.
 *
 * A Live photo is a converted HEIC/HEIF image sequence: it rests on its still
 * frame and plays only while pointed at, so it reads as a photograph until the
 * reader shows interest in it. That behavior needs a script — `autoplay` would
 * make it a looping animation, and `controls` would make it a video player.
 *
 * The directives are attached at render time, and only to Live photos (see
 * render_block_core_video), so an ordinary video page never loads this module.
 */
store(
	'core/video',
	{
		actions: {
			playLivePhoto() {
				const { ref } = getElement();
				// Browsers allow muted videos to be played programmatically.
				ref?.play?.().catch( () => {} );
			},
			pauseLivePhoto() {
				const { ref } = getElement();
				if ( ! ref ) {
					return;
				}
				ref.pause();
				// Return to the still frame the reader started from.
				ref.currentTime = 0;
			},
		},
	},
	{ lock: true }
);
