/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	cornerAll,
	cornerBottomLeft,
	cornerBottomRight,
	cornerTopLeft,
	cornerTopRight,
} from '@wordpress/icons';

export const DEFAULT_VALUES = {
	topLeft: undefined,
	topRight: undefined,
	bottomLeft: undefined,
	bottomRight: undefined,
};

export const RANGE_CONTROL_MAX_SIZE = 8;

export const EMPTY_ARRAY = [];

export const CORNERS = {
	all: __( 'Border radius' ),
	topLeft: __( 'Top left' ),
	topRight: __( 'Top right' ),
	bottomLeft: __( 'Bottom left' ),
	bottomRight: __( 'Bottom right' ),
};

export const ICONS = {
	all: cornerAll,
	topLeft: cornerTopLeft,
	topRight: cornerTopRight,
	bottomLeft: cornerBottomLeft,
	bottomRight: cornerBottomRight,
};

export const MIN_BORDER_RADIUS_VALUE = 0;

export const MAX_BORDER_RADIUS_VALUES = {
	px: 100,
	em: 20,
	rem: 20,
};
