/**
 * External dependencies
 */
import { isFunction, isObject, isString } from 'lodash';
import { default as tinycolor, mostReadable } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { Component, isValidElement } from '@wordpress/element';

/**
 * Array of icon colors containing a color to be used if the icon color
 * was not explicitly set but the icon background color was.
 *
 * @type {Object}
 */
const ICON_COLORS = [ '#191e23', '#f8f9f9' ];

/**
 * Function that checks if the parameter is a valid icon object.
 *
 * For more information:
 * @see https://wordpress.org/gutenberg/handbook/block-api/#icon-optional
 *
 * @param {*} icon  Parameter to be checked.
 *
 * @return {boolean} True if the parameter is a valid icon object and false otherwise.
 */

function isValidIconObject( icon ) {
	const src = isObject( icon ) && icon.src;

	return !! src && (
		isString( src ) ||
		isValidElement( src ) ||
		isFunction( src ) ||
		src instanceof Component
	);
}

/**
 * Function that receives an icon as set by the blocks during the registration
 * and returns a new icon object that is normalized so we can rely on just on possible icon structure
 * in the codebase.
 *
 * @param {(Object|string|WPElement)} icon  Slug of the Dashicon to be shown
 *                                          as the icon for the block in the
 *                                          inserter, or element or an object describing the icon.
 *
 * @return {Object} Object describing the icon.
 */
export function normalizeIconObject( icon ) {
	if ( isValidIconObject( icon ) ) {
		if ( icon.background ) {
			const normalizedIcon = { ...icon };
			const tinyBgColor = tinycolor( icon.background );
			if ( ! icon.foreground ) {
				normalizedIcon.foreground = mostReadable(
					tinyBgColor,
					ICON_COLORS,
					{ includeFallbackColors: true, level: 'AA', size: 'large' }
				).toHexString();
			}
			normalizedIcon.shadowColor = tinyBgColor.setAlpha( 0.3 ).toRgbString();

			return normalizedIcon;
		}
		return icon;
	}

	return {
		src: icon,
	};
}
