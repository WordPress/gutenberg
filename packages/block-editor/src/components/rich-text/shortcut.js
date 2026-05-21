/**
 * WordPress dependencies
 */
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

// `RichTextShortcut` now lives in `@wordpress/rich-text` so it shares the
// `keyboardShortcutContext` with standalone rich text fields. Re-exported here
// for back-compat (e.g. `@wordpress/format-library` imports it from
// `@wordpress/block-editor`).
export const { RichTextShortcut } = unlock( richTextPrivateApis );
