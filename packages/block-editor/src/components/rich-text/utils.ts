import { RichTextData, create } from '@wordpress/rich-text';
import type { RichTextFormatList, RichTextValue } from '@wordpress/rich-text';

export function addActiveFormats(
	value: RichTextValue,
	activeFormats?: RichTextFormatList
) {
	if ( activeFormats?.length ) {
		let index = value.formats.length;

		while ( index-- ) {
			value.formats[ index ] = [
				...activeFormats,
				...( value.formats[ index ] || [] ),
			];
		}
	}
}

/**
 * Get the multiline tag based on the multiline prop.
 *
 * @param multiline The multiline prop.
 *
 * @return The multiline tag.
 */
export function getMultilineTag(
	multiline?: string | boolean | null
): 'p' | 'li' | undefined {
	if ( multiline !== true && multiline !== 'p' && multiline !== 'li' ) {
		return;
	}

	return multiline === true ? 'p' : multiline;
}

export function isEmpty( value?: { length: number } | null ) {
	return ! value || value.length === 0;
}

export function getAllowedFormats( {
	allowedFormats,
	disableFormats,
}: {
	allowedFormats?: readonly string[];
	disableFormats?: boolean;
} ): readonly string[] | undefined {
	if ( disableFormats ) {
		return getAllowedFormats.EMPTY_ARRAY;
	}

	return allowedFormats;
}

// An empty literal would be typed as `never[]`.
getAllowedFormats.EMPTY_ARRAY = [] as string[];

/**
 * The formats, replacements and text of a rich text attribute value, which is
 * rich text data or an HTML string. Spreading rich text data would lose them:
 * they are getters.
 *
 * @param value Attribute value.
 *
 * @return Rich text value without a selection.
 */
export function toRecord( value: unknown ): RichTextValue {
	if ( value instanceof RichTextData ) {
		const { formats, replacements, text } = value;
		return { formats, replacements, text };
	}
	return create( { html: value ? String( value ) : '' } );
}
