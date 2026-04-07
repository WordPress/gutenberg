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
export type YMapRecord = Record< number | string, any >;

/**
 * Branded type aliases for Y.Type. In Yjs v14, Y.Map, Y.Array, and Y.Text have
 * been unified into a single Y.Type class. The DeltaConf generic on Y.Type is
 * meant to provide type-level discrimination (text vs. children vs. attrs), but
 * as of v14-rc.2 the generated TypeScript declarations do not propagate the
 * generic into method signatures.
 *
 * These types allow the correct value type to be inferred from method
 * invocations (e.g., `getAttr` on YMap, `get` on YArray). They are just type
 * wraps / overlays and do not change the runtime behavior of Y.Type.
 *
 * - Always prefer these type aliases over Y.Type and use the create* or getRoot*
 *   functions to construct them.
 *
 * - Do not use `instanceof Y.Type` checks. Instead, use the is* functions below.
 */

export interface YArray< T >
	extends Y.Type< { children: any; name: 'YArray' } > {
	forEach: (
		callback: ( value: T, index: number, array: YArray< T > ) => void
	) => void;
	get: ( index: number ) => T | undefined;
	insert: ( index: number, values: T[] ) => void;
	// add types for other Y.Type methods as needed
}

export interface YMap< T extends YMapRecord >
	extends Y.Type< { attrs: YMapRecord; name: 'YMap' } > {
	deleteAttr: < K extends keyof T >( key: K ) => void;
	forEachAttr: (
		callback: (
			value: T[ keyof T ],
			key: string | number,
			map: this
		) => void
	) => void;
	getAttr: < K extends keyof T >( key: K ) => T[ K ] | undefined;
	getAttrs: () => T;
	hasAttr: < K extends keyof T >( key: K ) => boolean;
	setAttr: < K extends keyof T >( key: K, value: T[ K ] ) => T[ K ];
	// add types for other Y.Type methods as needed
}

export interface YText extends Y.Type< { name: 'YText'; text: true } > {}

/**
 * Get or create a root-level Map for the given Y.Doc. Use this instead of
 * doc.get() for additional type safety.
 *
 * @param doc Y.Doc
 * @param key Document key
 */
export function getRootMap< T extends YMapRecord >(
	doc: Y.Doc,
	key: string
): YMap< T > {
	// Do not pass a type hint — root type names set via doc.get() do not
	// survive sync, and named types wrap content in XML tags on toString().
	return doc.get( key ) as YMap< T >;
}

/**
 * Create a new Y.Type with YArray name, optionally initialized with data. Use
 * this instead of `new Y.Type()` for additional type safety.
 *
 * @param items Optional array items to initialize the type with.
 */
export function createYArray< T >( items: T[] = [] ): YArray< T > {
	const ytype = new Y.Type( 'YArray' ) as YArray< T >;

	// Use insert instead of push to avoid v14's "premature access" warning
	// (push accesses .length on unintegrated types).
	if ( items.length > 0 ) {
		ytype.insert( 0, items );
	}

	return ytype;
}

/**
 * Create a new Y.Type with YMap name, optionally initialized with
 * data. Use this instead of `new Y.Type()` for additional type safety.
 *
 * @param partial Partial map data to initialize the type with.
 */
export function createYMap< T extends YMapRecord >(
	partial: Partial< T > = {}
): YMap< T > {
	const ytype = new Y.Type( 'YMap' ) as YMap< T >;

	for ( const [ key, value ] of Object.entries( partial ) ) {
		ytype.setAttr( key, value );
	}

	return ytype;
}

/**
 * Create a new Y.Type with YText name, optionally initialized with
 * data. Use this instead of `new Y.Type()` for additional type safety.
 *
 * NOTE: Named Y.Types wrap their content in XML tags when toString() is called
 * (e.g. `<YText>content</YText>`). Use `yTextToString()` instead of
 * `toString()` to get the plain text content of a YText instance.
 *
 * @param text Optional text to initialize the type with.
 */
export function createYText( text: string = '' ): YText {
	const ytype = new Y.Type( 'YText' ) as YText;

	// Use insert instead of push to avoid v14's "premature access" warning
	// (push accesses .length on unintegrated types).
	if ( text ) {
		ytype.insert( 0, text );
	}
	return ytype;
}

/**
 * General type guard for Y.Type. Do not use this directly; use the more specific
 * isYArray, isYMap, or isYText guards.
 *
 * @param value Value to check.
 */
function isYType( value: unknown ): value is Y.Type {
	return value instanceof Y.Type;
}

/**
 * Type guard to check if a value is a Y.Type (used as an array) without losing
 * type information.
 *
 * Note: In Yjs v14's unified type system, all Y.Types share the same class.
 * This guard only checks `instanceof Y.Type`; the branded generic provides
 * compile-time safety while the runtime check ensures the value is a Y.Type.
 *
 * @param value Value to check.
 */
export function isYArray< T >( value: unknown ): value is YArray< T > {
	return isYType( value ) && 'YArray' === value.name;
}

/**
 * Type guard to check if a value is a Y.Type (used as a map) without losing
 * type information.
 *
 * Note: In Yjs v14's unified type system, all Y.Types share the same class.
 * This guard only checks `instanceof Y.Type`; the branded generic provides
 * compile-time safety while the runtime check ensures the value is a Y.Type.
 *
 * @param value Value to check.
 */
export function isYMap< T extends YMapRecord >(
	value: unknown
): value is YMap< T > {
	return isYType( value ) && 'YMap' === value.name;
}

/**
 * Type guard that narrows a value to `YText`.
 *
 * Note: In Yjs v14's unified type system, all Y.Types share the same class.
 * This guard only checks `instanceof Y.Type`; the branded generic provides
 * compile-time safety while the runtime check ensures the value is a Y.Type.
 *
 * @param value Value to check.
 */
export function isYText( value: unknown ): value is YText {
	return isYType( value ) && 'YText' === value.name;
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
	const blocks = ymap.getAttr( 'blocks' );

	if ( ! isYArray< YBlock >( blocks ) ) {
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
	for ( let i = 0; i < blocks.length; i++ ) {
		const block = blocks.get( i );

		if ( block?.getAttr( 'clientId' ) === blockId ) {
			return block;
		}

		const innerBlocks = block?.getAttr( 'innerBlocks' );

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

/**
 * Recursively serialize a Y.Type value to its plain JavaScript equivalent,
 * replicating the behavior of Yjs v13's `toJSON()` method which recursively
 * serialized nested Y.Type values.
 *
 * @param value The value to serialize.
 * @return The plain JavaScript equivalent.
 */
function serialize( value: unknown ): unknown {
	if ( isYMap( value ) ) {
		return serialize( value.getAttrs() );
	}

	if ( isYArray( value ) ) {
		return serialize( value.toArray() );
	}

	if ( isYText( value ) ) {
		return yTextToString( value );
	}

	// Serializable primitives can be returned as-is.
	const primitives = [ 'boolean', 'bigint', 'number', 'string', 'undefined' ];
	if ( primitives.includes( typeof value ) ) {
		return value;
	}

	if ( Array.isArray( value ) ) {
		return value.map( serialize );
	}

	if ( value && typeof value === 'object' ) {
		return Object.fromEntries(
			Object.entries( value ).map( ( [ k, v ] ) => [ k, serialize( v ) ] )
		);
	}

	return null;
}

/**
 * Convert a YMap to a plain JavaScript object by recursively serializing its
 * attributes. This replicates the behavior of Yjs v13's `toJSON()` method which
 * recursively serialized nested Y.Type values.
 *
 * @param ymap The YMap to convert.
 * @return The plain JavaScript equivalent of the YMap.
 */
export function yMapToJSON< T extends YMapRecord >( ymap: YMap< T > ): T {
	// Root-level Y.Types (from doc.get()) have name === null regardless
	// of any type hint passed. Their name does not survive sync, so
	// isYMap() would not match and serialize() would fall through to the
	// text-like case. Nested Y.Types (from createYMap/createYArray/
	// createYText) DO preserve names.
	return serialize( ymap.getAttrs() ) as T;
}

/**
 * Get the plain text content of a YText instance. Named Y.Types wrap their
 * content in XML tags when `toString()` is called; this function bypasses
 * that by reading children directly via `toArray()`.
 *
 * @param ytext The YText instance.
 * @return The plain text content.
 */
export function yTextToString( ytext: YText ): string {
	return ytext.toArray().join( '' );
}
