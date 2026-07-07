/**
 * WordPress dependencies
 */
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useRichTextShortcut } = unlock( richTextPrivateApis );

// Thin wrapper around the `useRichTextShortcut` hook from
// `@wordpress/rich-text`, kept for back-compat (e.g.
// `@wordpress/format-library` imports it from `@wordpress/block-editor`).
export function RichTextShortcut( { character, type, onUse } ) {
	useRichTextShortcut( { character, type, onUse } );
	return null;
}
