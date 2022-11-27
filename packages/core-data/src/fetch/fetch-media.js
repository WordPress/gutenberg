/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME as coreStore } from '../name';

export default async function fetchMedia( settings = {} ) {
	return resolveSelect( coreStore ).getMediaItems( settings );
}
