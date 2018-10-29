/**
 * External dependencies
 */
import { has, isFunction, isString } from 'lodash';
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
 * Function that checks if the parameter is a valid icon.
 *
 * @param {*} icon  Parameter to be checked.
 *
 * @return {boolean} True if the parameter is a valid icon and false otherwise.
 */

export function isValidIcon( icon ) {
	return !! icon && (
		isString( icon ) ||
		isValidElement( icon ) ||
		isFunction( icon ) ||
		icon instanceof Component
	);
}

/**
 * Function that receives an icon as set by the formats during the registration
 * and returns a new icon object that is normalized so we can rely on just on possible icon structure
 * in the codebase.
 *
 * @param {(Object|string|WPElement)} icon  Slug of the Dashicon to be shown
 *                                          as the icon for the format in the inserter, block toolbar
 *                                          or element or an object describing the icon.
 *
 * @return {Object} Object describing the icon.
 */
export function normalizeIconObject( icon ) {
	if ( ! icon ) {
		icon = 'block-default';
	}

	if ( isValidIcon( icon ) ) {
		return { src: icon };
	}

	if ( has( icon, [ 'background' ] ) ) {
		const tinyBgColor = tinycolor( icon.background );

		return {
			...icon,
			foreground: icon.foreground ? icon.foreground : mostReadable(
				tinyBgColor,
				ICON_COLORS,
				{ includeFallbackColors: true, level: 'AA', size: 'large' }
			).toHexString(),
			shadowColor: tinyBgColor.setAlpha( 0.3 ).toRgbString(),
		};
	}

	return icon;
}
