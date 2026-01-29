/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

// TODO: The following line should have been:
//
//   const unlockedApis = unlock( blockEditorPrivateApis );
//
// But there are hidden circular dependencies in RNMobile code, specifically in
// certain native components in the `components` package that depend on
// `block-editor`. What follows is a workaround that defers the `unlock` call
// to prevent native code from failing.
//
// Fix once https://github.com/WordPress/gutenberg/issues/52692 is closed.
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
