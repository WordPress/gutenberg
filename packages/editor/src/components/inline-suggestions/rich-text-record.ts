import { RichTextData, create } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';

/**
 * Read a block attribute value as a rich-text record. `RichTextData` already
 * holds a parsed record, so it is read directly instead of being serialized
 * to HTML and parsed back, which cost two full passes per call on the
 * per-keystroke path. The arrays are copied so callers can treat the result
 * as their own. Plain strings are parsed.
 *
 * @param value Block attribute value (RichTextData, string, or other).
 * @return Rich-text record, or null when the value isn't rich text.
 */
export function toRichTextRecord( value: any ): RichTextValue | null {
	if ( value instanceof RichTextData ) {
		// `RichTextData` types its arrays as `never[]`, and `RichTextValue`
		// declares `start` and `end` as required even though a record with
		// no selection carries neither, so the copy is asserted rather than
		// given a fake selection.
		return {
			formats: value.formats.slice(),
			replacements: value.replacements.slice(),
			text: value.text,
		} as unknown as RichTextValue;
	}
	if ( typeof value === 'string' ) {
		return create( { html: value } );
	}
	return null;
}
