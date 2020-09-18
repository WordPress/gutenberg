/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const INSERT_POINT_WIDTH = 23;
export const GRADIENT_MARKERS_WIDTH = 18;
export const MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_MARKER =
	( INSERT_POINT_WIDTH + GRADIENT_MARKERS_WIDTH ) / 2;
export const MINIMUM_ABSOLUTE_LEFT_POSITION = 5;
export const MINIMUM_DISTANCE_BETWEEN_POINTS = 0;
export const MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT = 10;
export const KEYBOARD_CONTROL_POINT_VARIATION = MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT;
export const MINIMUM_SIGNIFICANT_MOVE = 5;
export const DEFAULT_GRADIENT =
	'linear-gradient(135deg, rgba(6, 147, 227, 1) 0%, rgb(155, 81, 224) 100%)';
export const COLOR_POPOVER_PROPS = {
	className: 'components-custom-gradient-picker__color-picker-popover',
	position: 'top',
};
export const DEFAULT_LINEAR_GRADIENT_ANGLE = 180;
export const HORIZONTAL_GRADIENT_ORIENTATION = {
	type: 'angular',
	value: 90,
};

export const GRADIENT_OPTIONS = [
	{ value: 'linear-gradient', label: __( 'Linear' ) },
	{ value: 'radial-gradient', label: __( 'Radial' ) },
];
