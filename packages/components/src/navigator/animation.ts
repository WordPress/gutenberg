import styles from './style.module.scss';

// Keep the fallback timeouts aligned with the slide duration in style.module.scss.
// Both slide animations outlast the fade animation and its delay.
export const TOTAL_ANIMATION_DURATION = {
	IN: 300,
	OUT: 300,
};

// CSS Modules exports the scoped keyframe names used by native animationend events.
export const ANIMATION_END_NAMES = {
	end: {
		in: styles[ 'slide-from-right' ],
		out: styles[ 'slide-to-left' ],
	},
	start: {
		in: styles[ 'slide-from-left' ],
		out: styles[ 'slide-to-right' ],
	},
};
