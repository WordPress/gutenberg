/**
 * External dependencies
 */
import { find, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	receiveEntityRecords,
	receiveThemeSupports,
	receiveEmbedPreview,
} from './actions';
import { getKindEntities } from './entities';
import { apiFetch } from './controls';
import { getNextLinkFromResponse } from './utils/pagination';

/**
 * Requests authors from the REST API.
 */
export function* getAuthors() {
	yield getEntityRecords( 'root', 'user', {
		who: 'authors',
		per_page: -1,
	} );
}

/**
 * Requests an entity's record from the REST API.
 *
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 */
export function* getEntityRecord( kind, name, key ) {
	const entities = yield getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	const record = yield apiFetch( { path: `${ entity.baseURL }/${ key }?context=edit` } );
	yield receiveEntityRecords( kind, name, record );
}

/**
 * Requests the entity's records from the REST API.
 *
 * @param {string}  kind   Entity kind.
 * @param {string}  name   Entity name.
 * @param {Object?} query  Query Object.
 */
export function* getEntityRecords( kind, name, query = {} ) {
	const entities = yield getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}
	let records;
	if ( query.per_page !== -1 ) {
		const path = addQueryArgs( entity.baseURL, {
			...query,
			context: 'edit',
		} );
		records = Object.values( yield apiFetch( { path } ) );
	} else {
		let nextPath = addQueryArgs( entity.baseURL, {
			...omit( query, 'per_page' ),
			context: 'edit',
			per_page: 100,
		} );
		records = [];
		do {
			const response = yield apiFetch( {
				path: nextPath,
				parse: false,
			} );
			const newRecords = yield { type: 'RESOLVE_PROMISE', promise: response.json() };
			records = records.concat( Object.values( newRecords ) );
			nextPath = getNextLinkFromResponse( response );
		} while ( nextPath );
	}
	yield receiveEntityRecords( kind, name, records, query );
}

/**
 * Requests theme supports data from the index.
 */
export function* getThemeSupports() {
	const activeThemes = yield apiFetch( { path: '/wp/v2/themes?status=active' } );
	yield receiveThemeSupports( activeThemes[ 0 ].theme_supports );
}

/**
 * Requests a preview from the from the Embed API.
 *
 * @param {string} url   URL to get the preview for.
 */
export function* getEmbedPreview( url ) {
	try {
		const embedProxyResponse = yield apiFetch( { path: addQueryArgs( '/oembed/1.0/proxy', { url } ) } );
		yield receiveEmbedPreview( url, embedProxyResponse );
	} catch ( error ) {
		// Embed API 404s if the URL cannot be embedded, so we have to catch the error from the apiRequest here.
		yield receiveEmbedPreview( url, false );
	}
}
