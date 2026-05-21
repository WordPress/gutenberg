/**
 * WordPress dependencies
 */
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

// `RichTextInputEvent` now lives in `@wordpress/rich-text` so it shares the
// `inputEventContext` with standalone rich text fields. Re-exported here for
// back-compat (e.g. `@wordpress/format-library` imports it, aliased as
// `__unstableRichTextInputEvent`, from `@wordpress/block-editor`).
export const { RichTextInputEvent } = unlock( richTextPrivateApis );
