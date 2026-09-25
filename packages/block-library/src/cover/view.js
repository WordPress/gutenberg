import { getContext, store } from '@wordpress/interactivity';
import { prefersReducedMotion } from '@wordpress/a11y';

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
	},
	{ lock: true }
);
