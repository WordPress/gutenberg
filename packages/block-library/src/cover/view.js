import { getContext, getElement, store } from '@wordpress/interactivity';
import { prefersReducedMotion } from '../utils/reduced-motion';

store(
	'core/cover',
	{
		state: {
			get videoSrc() {
				const { src, reducedMotionSrc } = getContext();

				// The server renders the autoplaying source, so it is only
				// replaced for a visitor who has asked for reduced motion.
				if ( reducedMotionSrc && prefersReducedMotion() ) {
					return reducedMotionSrc;
				}

				return src;
			},
		},
		callbacks: {
			stopBackgroundVideo() {
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
	},
	{ lock: true }
);
