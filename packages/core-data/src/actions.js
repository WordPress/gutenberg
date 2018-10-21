/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	receiveItems,
	receiveQueriedItems,
} from './queried-data';

export function receiveUserQuery() {
	deprecated( 'receiveUserQuery action (`core`)', {
		plugin: 'Gutenberg',
		version: '4.2',
	} );
	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Returns an action object used in adding new entities.
 *
 * @param {Array} entities  Entities received.
 *
 * @return {Object} Action object.
 */
export function addEntities( entities ) {
	return {
		type: 'ADD_ENTITIES',
		entities,
	};
}

/**
 * Returns an action object used in signalling that entity records have been received.
 *
 * @param {string}       kind    Kind of the received entity.
 * @param {string}       name    Name of the received entity.
 * @param {Array|Object} records Records received.
 * @param {?Object}      query  Query Object.
 *
 * @return {Object} Action object.
 */
export function receiveEntityRecords( kind, name, records, query ) {
	let action;
	if ( query ) {
		action = receiveQueriedItems( records, query );
	} else {
		action = receiveItems( records );
	}

	return {
		...action,
		kind,
		name,
	};
}

/**
 * Returns an action object used in signalling that the index has been received.
 *
 * @param {Object} themeSupports Theme support for the current theme.
 *
 * @return {Object} Action object.
 */
export function receiveThemeSupports( themeSupports ) {
	return {
		type: 'RECEIVE_THEME_SUPPORTS',
		themeSupports,
	};
}

/**
 * Returns an action object used in signalling that the preview data for
 * a given URl has been received.
 *
 * @param {string}  url      URL to preview the embed for.
 * @param {Mixed}   preview  Preview data.
 *
 * @return {Object} Action object.
 */
export function receiveEmbedPreview( url, preview ) {
	return {
		type: 'RECEIVE_EMBED_PREVIEW',
		url,
		preview,
	};
}
