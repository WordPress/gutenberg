// Motion configuration for dropdown-like popovers.
// Keep constants in sync with: packages/ui/src/utils/css/dropdown-motion.module.css
// and packages/components/src/menu/style.module.scss.
// Values should stay in sync with the WPDS motion design tokens.

export const DROPDOWN_MOTION = Object.freeze( {
	SLIDE_DISTANCE: 4,
	SLIDE_DURATION: 200,
	SLIDE_EASING: {
		function: 'cubic-bezier',
		args: [ 0.25, 0, 0, 1 ] as const,
	},
	FADE_DURATION: 100,
	FADE_EASING: {
		function: 'linear',
	},
} );
