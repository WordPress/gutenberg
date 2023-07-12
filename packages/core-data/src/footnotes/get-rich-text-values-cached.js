/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../private-apis';

const { getRichTextValues } = unlock( blockEditorPrivateApis );

const cache = new WeakMap();

export default function getRichTextValuesCached( block ) {
	if ( ! cache.has( block ) ) {
		const values = getRichTextValues( [ block ] );
		cache.set( block, values );
	}
	return cache.get( block );
}
