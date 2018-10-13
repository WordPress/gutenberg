/**
 * External dependencies
 */
import { isFunction, isString } from 'lodash';
import { default as tinycolor, mostReadable } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
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
 *                                          as the icon for the format in the
 *                                          inserter, or element or an object describing the icon.
 *
 * @return {Object} Object describing the icon.
 */
export function normalizeIconObject( icon ) {
	if ( ! icon ) {
		return { src: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 7h-1V5h-4v2h-4V5H6v2H5c-1.1 0-2 .9-2 2v10h18V9c0-1.1-.9-2-2-2zm0 10H5V9h14v8z" /></svg> };
	}
	if ( isValidIcon( icon ) ) {
		return { src: icon };
	}

	if ( icon.background ) {
		const tinyBgColor = tinycolor( icon.background );
		if ( ! icon.foreground ) {
			const foreground = mostReadable(
				tinyBgColor,
				ICON_COLORS,
				{ includeFallbackColors: true, level: 'AA', size: 'large' }
			).toHexString();
			icon.foreground = foreground;
		}
		icon.shadowColor = tinyBgColor.setAlpha( 0.3 ).toRgbString();
	}
	return icon;
}

/**
 * Registers a new format provided a unique name and an object defining its
 * behavior.
 *
 * @param {Object} settings Format settings.
 *
 * @return {?WPFormat} The format, if it has been successfully registered;
 *                     otherwise `undefined`.
 */
export function registerFormatType( settings ) {
	if ( typeof settings.name !== 'string' ) {
		window.console.error(
			'Format names must be strings.'
		);
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( settings.name ) ) {
		window.console.error(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		return;
	}

	if ( select( 'core/formats' ).getFormatType( settings.name ) ) {
		window.console.error(
			'Format "' + settings.name + '" is already registered.'
		);
		return;
	}

	if ( ! settings || ! isFunction( settings.edit ) ) {
		window.console.error(
			'The "edit" property must be specified and must be a valid function.'
		);
		return;
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		window.console.error(
			'The format "' + settings.name + '" must have a title.'
		);
		return;
	}

	if ( typeof settings.title !== 'string' ) {
		window.console.error(
			'Format titles must be strings.'
		);
		return;
	}

	settings.icon = normalizeIconObject( settings.icon );

	if ( ! isValidIcon( settings.icon.src ) ) {
		window.console.error(
			'The icon passed is invalid. ' +
			'The icon should be a string, an element, a function, or an object following the specifications documented in https://wordpress.org/gutenberg/handbook/format-api/#icon-optional'
		);
		return;
	}

	dispatch( 'core/formats' ).addFormatTypes( settings );

	return settings;
}
