/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	alignNone,
	positionCenter,
	positionLeft,
	positionRight,
} from '@wordpress/icons';

export const MIN_EXCERPT_LENGTH = 10;
export const MAX_EXCERPT_LENGTH = 100;
export const MAX_POSTS_COLUMNS = 6;

export const BLOCK_ALIGNMENTS_CONTROLS = [
	{ value: undefined, label: __( 'None' ), icon: alignNone },
	{ value: 'left', label: __( 'Align left' ), icon: positionLeft },
	{
		value: 'center',
		label: __( 'Align center' ),
		icon: positionCenter,
	},
	{ value: 'right', label: __( 'Align right' ), icon: positionRight },
];
