import { getContext, store } from '@wordpress/interactivity';
import { prefersReducedMotion } from '@wordpress/a11y';

store(
	'core/cover',
	{
		state: {
			get videoSrc() {
				const { src, autoplaySrc } = getContext();

				// The server renders the source that does not autoplay, so a
				// visitor who prefers reduced motion keeps it untouched and the
				// embed is never loaded twice for them.
				if ( ! autoplaySrc || prefersReducedMotion() ) {
					return src;
				}

				return autoplaySrc;
			},
		},
	},
	{ lock: true }
);
