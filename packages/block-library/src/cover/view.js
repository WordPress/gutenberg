import { getContext, getElement, store } from '@wordpress/interactivity';
import { onReducedMotionChange, prefersReducedMotion } from '@wordpress/a11y';

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
				const { ref } = getElement();

				// The video is saved with `autoplay`, so it is stopped here
				// rather than never started. Clearing the attribute as well
				// keeps it from playing again if the source reloads.
				const stopIfPreferred = ( prefersReduced ) => {
					if ( prefersReduced ) {
						ref.autoplay = false;
						ref.pause();
					}
				};

				stopIfPreferred( prefersReducedMotion() );

				return onReducedMotionChange( stopIfPreferred );
			},
		},
	},
	{ lock: true }
);
