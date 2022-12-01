/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME as coreStore } from '../name';

export default async function fetchMedia( settings = {} ) {
	// TODO: check if/how we can use an AbortController to cancel the requests..
	// This goes down to `getEntityRecords` resolver which uses `apiFetch` which doesn't support it yet.
	return resolveSelect( coreStore ).getMediaItems( settings );
}
