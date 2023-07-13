/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../private-apis';

// Avoid calling `unlock` at the module level, deferring the call until needed
// in `getRichTextValuesCached`.
let unlockedApis;

const cache = new WeakMap();

export default function getRichTextValuesCached( block ) {
	if ( ! unlockedApis ) {
		unlockedApis = unlock( blockEditorPrivateApis );
	}

	if ( ! cache.has( block ) ) {
		const values = unlockedApis.getRichTextValues( [ block ] );
		cache.set( block, values );
	}
	return cache.get( block );
}
