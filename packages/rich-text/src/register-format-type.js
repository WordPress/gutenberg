/**
 * External dependencies
 */
import { isFunction, isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { Component, isValidElement } from '@wordpress/element';

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
		icon instanceof Component ||
		isValidIcon( icon.src )
	);
}

/**
 * Registers a new format provided a unique name and an object defining its
 * behavior.
 *
 * @param {string} name     Format name.
 * @param {Object} settings Format settings.
 *
 * @return {?WPFormat} The format, if it has been successfully registered;
 *                     otherwise `undefined`.
 */
export function registerFormatType( name, settings ) {
	settings = {
		name,
		icon: 'block-default',
		...settings,
	};

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

	if ( select( 'core/rich-text' ).getFormatType( settings.name ) ) {
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

	if ( 'keywords' in settings && settings.keywords.length > 3 ) {
		window.console.error(
			'The format "' + settings.name + '" can have a maximum of 3 keywords.'
		);
		return;
	}

	if ( typeof settings.title !== 'string' ) {
		window.console.error(
			'Format titles must be strings.'
		);
		return;
	}

	if ( ! isValidIcon( settings.icon ) ) {
		window.console.error(
			'The icon passed is invalid. ' +
			'The icon should be a string, an element, a function, or an object following the specifications documented in https://wordpress.org/gutenberg/handbook/format-api/#icon-optional'
		);
		return;
	}

	dispatch( 'core/rich-text' ).addFormatTypes( settings );

	return settings;
}
