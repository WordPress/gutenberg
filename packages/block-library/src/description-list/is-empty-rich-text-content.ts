import { isEmpty, RichTextData } from '@wordpress/rich-text';

/**
 * Returns whether a term or description has no content. Inline objects such
 * as images count as content.
 *
 * @param content The block's `content` attribute. It can be an HTML string
 *                after a merge.
 *
 * @return Whether the content is empty.
 */
export default function isEmptyRichTextContent( content: unknown ) {
	const value =
		content instanceof RichTextData
			? content
			: RichTextData.fromHTMLString(
					typeof content === 'string' ? content : ''
				);

	return isEmpty( value );
}
