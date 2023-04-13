/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	alignNone,
	positionCenter,
	positionLeft,
	positionRight,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';

export const BLOCK_ALIGNMENTS_CONTROLS = {
	none: {
		icon: alignNone,
		title: _x( 'None', 'Alignment option' ),
	},
	left: {
		icon: positionLeft,
		title: __( 'Align left' ),
	},
	center: {
		icon: positionCenter,
		title: __( 'Align center' ),
	},
	right: {
		icon: positionRight,
		title: __( 'Align right' ),
	},
	wide: {
		icon: stretchWide,
		title: __( 'Wide width' ),
	},
	full: {
		icon: stretchFullWidth,
		title: __( 'Full width' ),
	},
};

export const DEFAULT_CONTROL = 'none';

export const POPOVER_PROPS = {
	variant: 'toolbar',
};
