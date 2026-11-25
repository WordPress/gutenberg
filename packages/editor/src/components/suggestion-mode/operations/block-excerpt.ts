/**
 * The text a structural operation names its block by. A payload carries a
 * short excerpt and not the block: a snapshot of a large block would not fit
 * the payload, and nothing rebuilds a block from one.
 */
import { getBlockType } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import type { SuggestionOperation } from './payload';

/**
 * Longest excerpt a payload carries, in characters. Matches the length the
 * sidebar summary cuts quoted text to (`SUMMARY_MAX_CHARS`).
 */
export const BLOCK_EXCERPT_MAX_CHARS = 120;

/**
 * Plain visible text of a block, read from its first non-empty rich-text
 * attribute; inline suggestion markers add no text of their own. Returns
 * null for a block with no text (an image without a caption, a container,
 * an empty paragraph).
 *
 * @param blockName  Block name.
 * @param attributes Block attributes.
 * @return The block's text, or null.
 */
export function readBlockText(
	blockName: string | undefined,
	attributes: Record< string, any > | null | undefined
): string | null {
	if ( ! blockName || ! attributes ) {
		return null;
	}
	const definitions: Record< string, any > =
		getBlockType( blockName )?.attributes ?? {};
	for ( const [ key, definition ] of Object.entries( definitions ) ) {
		if (
			definition?.type !== 'rich-text' &&
			definition?.source !== 'rich-text'
		) {
			continue;
		}
		const value = attributes[ key ];
		let text = '';
		if ( value instanceof RichTextData ) {
			text = value.text;
		} else if ( typeof value === 'string' ) {
			text = RichTextData.fromHTMLString( value ).text;
		}
		// Drop the object replacement character inline images leave behind.
		text = text.replace( /￼/g, '' ).trim();
		if ( text ) {
			return text;
		}
	}
	return null;
}

/**
 * The excerpt of a block for a structural operation: its text on one line,
 * cut to `BLOCK_EXCERPT_MAX_CHARS` with an ellipsis.
 *
 * @param block Block, as the block editor holds it.
 * @return `{ excerpt }` to spread into the operation; empty for a block
 * with no text.
 */
export function blockExcerpt(
	block:
		{ name?: string; attributes?: Record< string, any > } | null | undefined
): { excerpt?: string } {
	const text = readBlockText( block?.name, block?.attributes )
		?.replace( /\s+/g, ' ' )
		.trim();
	if ( ! text ) {
		return {};
	}
	// Cut between characters, never inside a surrogate pair: half of one is
	// not valid JSON to the server.
	const characters = Array.from( text );
	if ( characters.length <= BLOCK_EXCERPT_MAX_CHARS ) {
		return { excerpt: text };
	}
	return {
		excerpt: `${ characters
			.slice( 0, BLOCK_EXCERPT_MAX_CHARS - 1 )
			.join( '' )
			.trimEnd() }…`,
	};
}

/**
 * The text of a structural operation's block: the live block's while it is
 * in the editor, which tracks typing into an inserted block, then the
 * payload's excerpt, then the block snapshot older payloads carried.
 *
 * @param op             Structural operation.
 * @param liveAttributes The block's attributes, when it is in the editor.
 * @return The text, or null when the block has none.
 */
export function structuralOperationText(
	op: SuggestionOperation,
	liveAttributes: Record< string, any > | null | undefined
): string | null {
	if ( liveAttributes ) {
		return readBlockText( op.blockName, liveAttributes );
	}
	if ( typeof op.excerpt === 'string' && op.excerpt.trim() ) {
		return op.excerpt;
	}
	return readBlockText( op.blockName, op.block?.attributes );
}
