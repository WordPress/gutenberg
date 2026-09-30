import { RichTextData, create } from '@wordpress/rich-text';

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
export function toRichTextRecord( value: any ) {
	if ( value instanceof RichTextData ) {
		return {
			formats: value.formats.slice(),
			replacements: value.replacements.slice(),
			text: value.text,
		};
	}
	if ( typeof value === 'string' ) {
		return create( { html: value } );
	}
	return null;
}
