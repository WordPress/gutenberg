import { getElement, store } from '@wordpress/interactivity';
import { prefersReducedMotion } from '../utils/reduced-motion';

/**
 * Playback for a Live photo Video block.
 *
 * A Live photo is a converted HEIC/HEIF image sequence: it rests on its still
 * frame and plays only while pointed at, so it reads as a photograph until the
 * reader shows interest in it. That behavior needs a script — `autoplay` would
 * make it a looping animation, and `controls` would make it a video player.
 *
 * A touch screen has no hover: a tap enters and leaves in one gesture. Touch
 * pointers are left to the click handler instead, which starts the motion on
 * one tap and returns to the still on the next.
 *
 * The directives are attached at render time, and only to Live photos (see
 * render_block_core_video), so an ordinary video never gets them.
 */

/**
 * Starts the motion. Browsers allow muted videos to be played
 * programmatically.
 *
 * @param {HTMLVideoElement} video The Live photo.
 */
function play( video ) {
	video.play?.().catch( () => {} );
}

/**
 * Stops the motion and returns to the still frame.
 *
 * The still is the poster, which may be a frame the author picked from the
 * middle of the motion. Rewinding would show the first frame instead;
 * reloading is what brings the poster back.
 *
 * @param {HTMLVideoElement} video The Live photo.
 */
function rest( video ) {
	video.pause();
	video.load();
}

store(
	'core/video',
	{
		callbacks: {
			stopAutoplay() {
				if ( ! prefersReducedMotion() ) {
					return;
				}

				// The video is saved with `autoplay`, so it is stopped here
				// rather than never started. Clearing the attribute as well
				// keeps it from playing again if the source reloads.
				const { ref } = getElement();
				ref.autoplay = false;
				ref.pause();
			},
		},
		actions: {
			playLivePhoto( event ) {
				const { ref } = getElement();
				if ( ! ref || event?.pointerType === 'touch' ) {
					return;
				}
				// A tap focuses the video too, and the click handler owns
				// taps; only keyboard focus plays it.
				if (
					event?.type === 'focus' &&
					! ref.matches( ':focus-visible' )
				) {
					return;
				}
				play( ref );
			},
			pauseLivePhoto( event ) {
				const { ref } = getElement();
				if ( ref && event?.pointerType !== 'touch' ) {
					rest( ref );
				}
			},
			toggleLivePhoto( event ) {
				const { ref } = getElement();
				// A mouse already plays it on hover; only a tap toggles.
				if ( ! ref || event?.pointerType !== 'touch' ) {
					return;
				}
				if ( ref.paused ) {
					play( ref );
				} else {
					rest( ref );
				}
			},
		},
	},
	{ lock: true }
);
