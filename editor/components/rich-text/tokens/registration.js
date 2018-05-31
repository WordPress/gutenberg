/**
 * External dependencies
 */
import { isFunction, has } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Browser dependencies
 */
const { error } = window.console;

const tokenSettings = {};

/**
 * Defined behavior of token settings.
 *
 * @typedef {WPTokenSettings}
 *
 * @property {string}             name       Token's namespaced name.
 * @property {string}             title      Human-readable label for a token.
 *                                           Shown in the token inserter.
 * @property {(string|WPElement)} icon       Slug of the Dashicon to be shown
 *                                           as the icon for the token in the
 *                                           inserter, or element.
 * @property {?string[]}          keywords   Additional keywords to produce
 *                                           block as inserter search result.
 * @property {Function}           save       Serialize behavior of a token,
 *                                           returning an element describing
 *                                           structure of the token's post
 *                                           content markup.
 * @property {WPComponent}        edit       Component rendering element to be
 *                                           interacted with in an editor.
 */

/**
 * Registers a new token provided a unique name and an object defining its
 * behavior. Once registered, the token is made available as an option to any
 * editor interface where tokens are implemented.
 *
 * @param {string}          name     Token name.
 * @param {WPTokenSettings} settings Token settings.
 *
 * @return {?WPTokenSettings} The token settings, if it has been successfully
 *                            registered; otherwise `undefined`.
 */
export function registerToken( name, settings ) {
	if ( typeof name !== 'string' ) {
		error(
			'Token names must be strings.'
		);
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		error(
			'Token names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-token'
		);
		return;
	}

	if ( getTokenSettings( name ) ) {
		error(
			'Token "' + name + '" is already registered.'
		);
		return;
	}

	settings = applyFilters( 'RichText.registerToken', settings, name );

	if ( ! settings || ! isFunction( settings.save ) ) {
		error(
			'The "save" property must be specified and must be a valid function.'
		);
		return;
	}

	if ( 'edit' in settings && ! isFunction( settings.edit ) ) {
		error(
			'The "edit" property must be a valid function.'
		);
		return;
	}

	if ( 'keywords' in settings && settings.keywords.length > 3 ) {
		error(
			'The token "' + name + '" can have a maximum of 3 keywords.'
		);
		return;
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		error(
			'The token "' + name + '" must have a title.'
		);
		return;
	}

	if ( typeof settings.title !== 'string' ) {
		error(
			'Token titles must be strings.'
		);
		return;
	}

	if ( ! settings.icon ) {
		settings.icon = 'block-default';
	}

	tokenSettings[ name ] = settings;

	return settings;
}

/**
 * Unregisters a token.
 *
 * @param {string} name Token name.
 *
 * @return {?WPTokenSettings} The previous token settings, if it has been
 *                            successfully unregistered; otherwise `undefined`.
 */
export function unregisterToken( name ) {
	const settings = getTokenSettings( name );

	if ( settings ) {
		delete tokenSettings[ name ];
		return settings;
	}
}

/**
 * Returns registered token settings.
 *
 * @param {string} name Token name.
 *
 * @return {?WPTokenSettings} Token settings.
 */
export function getTokenSettings( name ) {
	if ( ! name ) {
		return tokenSettings;
	}

	if ( has( tokenSettings, name ) ) {
		return tokenSettings[ name ];
	}
}
