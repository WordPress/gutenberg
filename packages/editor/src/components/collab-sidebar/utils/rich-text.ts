import { getBlockType } from '@wordpress/blocks';
import { create, RichTextData, toHTMLString } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';

/**
 * Key of the block's rich text attribute when that is all the content the
 * block has: exactly one attribute sourced from the markup, and it is rich
 * text. Formats applied across blocks reach only such blocks.
 *
 * A copy of `getSoleRichTextAttributeKey` in the block editor's
 * `multi-block-format-edit.tsx`, which isn't exported.
 *
 * @param blockName Block name.
 * @return Attribute key.
 */
export function getSoleRichTextAttributeKey(
	blockName: string | null | undefined
): string | undefined {
	const sourced = Object.entries(
		getBlockType( blockName ?? '' )?.attributes ?? {}
	).filter( ( [ , { source } ] ) => source );
	return sourced.length === 1 && sourced[ 0 ][ 1 ].source === 'rich-text'
		? sourced[ 0 ][ 0 ]
		: undefined;
}

/**
 * Key of the block's rich text attribute when the block is only that text:
 * its sole rich text attribute, see `getSoleRichTextAttributeKey`, and no
 * inner blocks.
 *
 * @param clientId      Block client ID.
 * @param getBlockName  Block-editor selector.
 * @param getBlockCount Block-editor selector.
 * @return Attribute key.
 */
export function getTextAttributeKey(
	clientId: string,
	getBlockName: ( clientId: string ) => string | null,
	getBlockCount: ( clientId: string ) => number
): string | undefined {
	return getBlockCount( clientId )
		? undefined
		: getSoleRichTextAttributeKey( getBlockName( clientId ) );
}

/**
 * A rich text record from an attribute value, which may be rich text data or
 * an HTML string.
 *
 * A copy of `toRecord` in the block editor's `components/rich-text/utils.ts`,
 * which isn't exported.
 *
 * @param value Attribute value.
 * @return Rich text value without a selection.
 */
export function toRecord( value: unknown ): RichTextValue {
	if ( value instanceof RichTextData ) {
		const { formats, replacements, text } = value;
		return { formats, replacements, text };
	}
	return create( { html: value ? String( value ) : '' } );
}

/**
 * An attribute value from a rich text record, of the same type as the current
 * value.
 *
 * A copy of `toAttribute` in the block editor's `multi-block-format-edit.tsx`,
 * which isn't exported.
 *
 * @param value   Rich text value.
 * @param current The current attribute value.
 * @return Attribute value.
 */
export function toAttribute(
	value: RichTextValue,
	current: unknown
): string | RichTextData {
	return typeof current === 'string'
		? toHTMLString( { value } )
		: new RichTextData( value );
}

let lastParsed: { html: string | null; record: RichTextValue | null } = {
	html: null,
	record: null,
};

/**
 * Record of an attribute value that can hold a note marker. A string is parsed
 * only when it holds a marker, and the last parse is cached: caret moves
 * re-read the same string. Rich text data is returned as is, since caret moves
 * read every attribute; its fields are getters, so read them rather than
 * spread it.
 *
 * @param value Attribute value.
 * @return Rich text value, or null when the value can't hold a marker.
 */
export function toNoteRecord( value: unknown ): RichTextValue | null {
	if ( value instanceof RichTextData ) {
		return value;
	}
	if ( typeof value !== 'string' || ! value.includes( 'wp-note' ) ) {
		return null;
	}
	if ( lastParsed.html !== value ) {
		lastParsed = { html: value, record: toRecord( value ) };
	}
	return lastParsed.record;
}
