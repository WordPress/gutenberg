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

// The color spaces and hue interpolation methods that a CSS
// `<color-interpolation-method>` accepts, e.g. `in oklch longer hue`.
// See https://www.w3.org/TR/css-color-4/#interpolation-space.
export const RECTANGULAR_INTERPOLATION_COLOR_SPACES = [
	'srgb',
	'srgb-linear',
	'display-p3',
	'a98-rgb',
	'prophoto-rgb',
	'rec2020',
	'lab',
	'oklab',
	'xyz',
	'xyz-d50',
	'xyz-d65',
];

export const POLAR_INTERPOLATION_COLOR_SPACES = [
	'hsl',
	'hwb',
	'lch',
	'oklch',
];

export const HUE_INTERPOLATION_METHODS = [
	'shorter',
	'longer',
	'increasing',
	'decreasing',
];
