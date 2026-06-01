// Motion configuration for dropdown-like popovers.
// Keep constants in sync with: packages/ui/src/utils/css/dropdown-motion.module.css
// Values should stay in sync with --wpds-motion-* design tokens.

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

const convertEasingToString = ( easing: {
	function: string;
	args?: readonly [ number, number, number, number ];
} ) => {
	if ( easing.args?.length ) {
		return `${ easing.function }(${ easing.args.join( ',' ) })`;
	}
	return easing.function;
};

// Note: --wpds-* tokens can't be used here directly because the build-time
// fallback injection is not compatible with Emotion. This file is consumed
// by Menu's Emotion styles.
export const DROPDOWN_MOTION_CSS = Object.freeze( {
	SLIDE_DISTANCE: `${ DROPDOWN_MOTION.SLIDE_DISTANCE }px`,
	SLIDE_DURATION: `${ DROPDOWN_MOTION.SLIDE_DURATION }ms`,
	SLIDE_EASING: convertEasingToString( DROPDOWN_MOTION.SLIDE_EASING ),
	FADE_DURATION: `${ DROPDOWN_MOTION.FADE_DURATION }ms`,
	FADE_EASING: convertEasingToString( DROPDOWN_MOTION.FADE_EASING ),
} );
