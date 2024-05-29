/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

export const ALLOWED_FILE_EXTENSIONS = [ 'otf', 'ttf', 'woff', 'woff2' ];

export const FONT_WEIGHTS = {
	100: _x( 'Thin', 'font weight' ),
	200: _x( 'Extra-light', 'font weight' ),
	300: _x( 'Light', 'font weight' ),
	400: _x( 'Normal', 'font weight' ),
	500: _x( 'Medium', 'font weight' ),
	600: _x( 'Semi-bold', 'font weight' ),
	700: _x( 'Bold', 'font weight' ),
	800: _x( 'Extra-bold', 'font weight' ),
	900: _x( 'Black', 'font weight' ),
};

export const FONT_STYLES = {
	normal: _x( 'Normal', 'font style' ),
	italic: _x( 'Italic', 'font style' ),
};
