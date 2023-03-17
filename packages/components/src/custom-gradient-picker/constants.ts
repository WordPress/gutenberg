/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const DEFAULT_GRADIENT =
	'linear-gradient(135deg, rgba(6, 147, 227, 1) 0%, rgb(155, 81, 224) 100%)';

export const DEFAULT_LINEAR_GRADIENT_ANGLE = 180;

export const HORIZONTAL_GRADIENT_ORIENTATION = {
	type: 'angular',
	value: '90',
} as const;

export const GRADIENT_OPTIONS = [
	{ value: 'linear-gradient', label: __( 'Linear' ) },
	{ value: 'radial-gradient', label: __( 'Radial' ) },
];

export const DIRECTIONAL_ORIENTATION_ANGLE_MAP = {
	top: 0,
	'top right': 45,
	'right top': 45,
	right: 90,
	'right bottom': 135,
	'bottom right': 135,
	bottom: 180,
	'bottom left': 225,
	'left bottom': 225,
	left: 270,
	'top left': 315,
	'left top': 315,
};
