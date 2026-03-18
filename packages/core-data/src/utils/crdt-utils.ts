/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';
import { create, insert, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import type { YBlock, YBlocks } from './crdt-blocks';
import type { YPostRecord } from './crdt';
import { CRDT_RECORD_MAP_KEY } from '../sync';

/**
 * A YMapRecord represents the shape of the data stored in a Y.Map.
 */
export type YMapRecord = Record< string, unknown >;

/**
 * A wrapper around Y.Map to provide type safety. The generic type accepted by
 * Y.Map represents the union of possible values of the map, which are varied in
 * many cases. This type is accurate, but its non-specificity requires aggressive
 * type narrowing or type casting / destruction with `as`.
 *
 * This type provides type enhancements so that the correct value type can be
 * inferred based on the provided key. It is just a type wrap / overlay, and
 * does not change the runtime behavior of Y.Map.
 *
 * This interface cannot extend Y.Map directly due to the limitations of
 * TypeScript's structural typing. One negative consequence of this is that
 * `instanceof` checks against Y.Map continue to work at runtime but will blur
 * the type at compile time. To navigate this, use the `isYMap` function below.
 */
export interface YMapWrap< T extends YMapRecord > extends Y.AbstractType< T > {
	delete: < K extends keyof T >( key: K ) => void;
	forEach: (
		callback: (
			value: T[ keyof T ],
			key: keyof T,
			map: YMapWrap< T >
		) => void
	) => void;
	has: < K extends keyof T >( key: K ) => boolean;
	get: < K extends keyof T >( key: K ) => T[ K ] | undefined;
	set: < K extends keyof T >( key: K, value: T[ K ] ) => void;
	toJSON: () => T;
	// add types for other Y.Map methods as needed
}

/**
 * Get or create a root-level Map for the given Y.Doc. Use this instead of
 * doc.getMap() for additional type safety.
 *
 * @param doc Y.Doc
 * @param key Map key
 */
export function getRootMap< T extends YMapRecord >(
	doc: Y.Doc,
	key: string
): YMapWrap< T > {
	return doc.getMap< T >( key ) as unknown as YMapWrap< T >;
}

/**
 * Create a new Y.Map (provided with YMapWrap type), optionally initialized with
 * data. Use this instead of `new Y.Map()` for additional type safety.
 *
 * @param partial Partial data to initialize the map with.
 */
export function createYMap< T extends YMapRecord >(
	partial: Partial< T > = {}
): YMapWrap< T > {
	return new Y.Map( Object.entries( partial ) ) as unknown as YMapWrap< T >;
}

/**
 * Type guard to check if a value is a Y.Map without losing type information.
 *
 * @param value Value to check.
 */
export function isYMap< T extends YMapRecord >(
	value: YMapWrap< T > | undefined
): value is YMapWrap< T > {
	return value instanceof Y.Map;
}

/**
 * Given a block ID and a Y.Doc, find the block in the document.
 *
 * @param blockId The block ID to find
 * @param ydoc    The Y.Doc to find the block in
 * @return The block, or null if the block is not found
 */
export function findBlockByClientIdInDoc(
	blockId: string,
	ydoc: Y.Doc
): YBlock | null {
	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );
	const blocks = ymap.get( 'blocks' );

	if ( ! ( blocks instanceof Y.Array ) ) {
		return null;
	}

	return findBlockByClientIdInBlocks( blockId, blocks );
}

// Marker for insertion.
const MARKER_START = 0xe000;

/**
 * Pick a marker character that does not appear in `text`. Returns the marker
 * or `null` if all candidates are present (extremely unlikely in practice).
 *
 * @param text The string to check for existing marker characters.
 */
function pickMarker( text: string ): string | null {
	const tryCount = 0x10;

	// Scan the unicode private use area for the first code point not present
	// in the text.
	for ( let code = MARKER_START; code < MARKER_START + tryCount; code++ ) {
		const candidate = String.fromCharCode( code );

		if ( ! text.includes( candidate ) ) {
			return candidate;
		}
	}

	return null;
}

/**
 * Convert an HTML character index (counting tag characters) to a rich-text
 * offset (counting only text characters). Used on read paths where Y.Text
 * resolves to an HTML index but the block editor expects a text offset.
 *
 * @param html      The full HTML string from Y.Text.
 * @param htmlIndex The HTML character index.
 * @return The corresponding rich-text offset.
 */
export function htmlIndexToRichTextOffset(
	html: string,
	htmlIndex: number
): number {
	if ( ! html.includes( '<' ) && ! html.includes( '&' ) ) {
		return htmlIndex;
	}

	const marker = pickMarker( html );
	if ( ! marker ) {
		return htmlIndex;
	}

	// Insert marker and let create() do the parsing.
	const withMarker =
		html.slice( 0, htmlIndex ) + marker + html.slice( htmlIndex );
	const value = create( { html: withMarker } );
	const markerPos = value.text.indexOf( marker );

	return markerPos === -1 ? htmlIndex : markerPos;
}

/**
 * Convert a rich-text offset (counting only text characters) to an HTML
 * character index (counting tag characters). Used on write paths where the
 * block editor provides a text offset but Y.Text expects an HTML index.
 *
 * @param html           The full HTML string from Y.Text.
 * @param richTextOffset The rich-text text offset.
 * @return The corresponding HTML character index.
 */
export function richTextOffsetToHtmlIndex(
	html: string,
	richTextOffset: number
): number {
	if ( ! html.includes( '<' ) && ! html.includes( '&' ) ) {
		return richTextOffset;
	}

	const marker = pickMarker( html );
	if ( ! marker ) {
		return richTextOffset;
	}

	const value = create( { html } );
	const markerValue = create( { text: marker } );
	// The marker must inherit the formatting at the insertion point so that
	// toHTMLString does not split surrounding tags (e.g. <strong>) around it.
	if ( value.formats[ richTextOffset ] ) {
		markerValue.formats[ 0 ] = value.formats[ richTextOffset ];
	}

	const withMarker = insert(
		value,
		markerValue,
		richTextOffset,
		richTextOffset
	);

	const htmlWithMarker = toHTMLString( { value: withMarker } );
	const markerIndex = htmlWithMarker.indexOf( marker );
	return markerIndex === -1 ? richTextOffset : markerIndex;
}

function findBlockByClientIdInBlocks(
	blockId: string,
	blocks: YBlocks
): YBlock | null {
	for ( const block of blocks ) {
		if ( block.get( 'clientId' ) === blockId ) {
			return block;
		}

		const innerBlocks = block.get( 'innerBlocks' );

		if ( innerBlocks && innerBlocks.length > 0 ) {
			const innerBlock = findBlockByClientIdInBlocks(
				blockId,
				innerBlocks
			);

			if ( innerBlock ) {
				return innerBlock;
			}
		}
	}

	return null;
}
