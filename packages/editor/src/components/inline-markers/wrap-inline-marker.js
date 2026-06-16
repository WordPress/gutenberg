/**
 * WordPress dependencies
 */
import { RichTextData, applyFormat, create } from '@wordpress/rich-text';

/**
 * Wrap a rich-text range with an inline `<mark>` marker format. Returns a new
 * RichTextData ready to write back into block attributes, or null when the
 * incoming value isn't a rich-text instance (legacy/string attributes).
 *
 * @param {*}      value              Existing block attribute value.
 * @param {Object} options
 * @param {string} options.formatType Rich-text format type to apply (e.g. `core/note`).
 * @param {Object} options.attributes Marker attributes (e.g. `{ 'data-id': '7' }`).
 * @param {number} options.start      Range start offset.
 * @param {number} options.end        Range end offset.
 * @return {?RichTextData} Wrapped value or null when the attribute isn't rich text.
 */
export function wrapInlineMarker(
	value,
	{ formatType, attributes, start, end }
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return null;
	}
	const record = applyFormat(
		create( { html: value.toHTMLString() } ),
		{ type: formatType, attributes },
		start,
		end
	);
	return new RichTextData( record );
}
