/**
 * WordPress dependencies
 */
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useRichTextInputEvent } = unlock( richTextPrivateApis );

// Thin wrapper around the `useRichTextInputEvent` hook from
// `@wordpress/rich-text`, kept for back-compat (e.g.
// `@wordpress/format-library` imports it, aliased as
// `__unstableRichTextInputEvent`, from `@wordpress/block-editor`).
export function RichTextInputEvent( { inputType, onInput } ) {
	useRichTextInputEvent( { inputType, onInput } );
	return null;
}
