// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { Block } from '@wordpress/blocks';
import type { RichTextValue } from '@wordpress/rich-text';
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
let unlockedApis: {
	getRichTextValues: (
		blocks: Array< Block >
	) => Array< RichTextValue | undefined >;
};

const cache = new WeakMap< Block, Array< RichTextValue | undefined > >();

export default function getRichTextValuesCached(
	block: Block
): Array< RichTextValue | undefined > {
	if ( ! unlockedApis ) {
		unlockedApis = unlock( blockEditorPrivateApis );
	}

	if ( ! cache.has( block ) ) {
		const values = unlockedApis.getRichTextValues( [ block ] );
		cache.set( block, values );
	}
	// Set above when missing.
	return cache.get( block )!;
}
