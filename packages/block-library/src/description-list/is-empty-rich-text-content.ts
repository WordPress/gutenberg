import { RichTextData } from '@wordpress/rich-text';

export default function isEmptyRichTextContent( content: unknown ) {
	if ( content instanceof RichTextData ) {
		return content.toPlainText().trim().length === 0;
	}

	if ( typeof content === 'string' ) {
		return (
			RichTextData.fromHTMLString( content ).toPlainText().trim()
				.length === 0
		);
	}

	return content === undefined || content === null;
}
