/**
 * Where each suggestion note is anchored in the loaded content, and whether
 * that anchor is still there.
 *
 * Every suggestion note is held by something in block content: an inline
 * `<mark class="wp-suggestion-<kind>">` marker, a structural `metadata.suggestion`
 * marker on a block, or an attribute proposal in that marker's `after`. The
 * note collector watches anchors disappear; the sidebar asks whether a
 * decided note's anchor is still present, which means the decision did not
 * reach the post. The server keeps the same rules in
 * `gutenberg_get_suggestion_anchor_index()`.
 */
import { useSelect } from '@wordpress/data';
import { RichTextData } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockTreeVersion } from './block-tree-version';
import { PENDING_ATTRIBUTES, markerAnchorKeys } from './marker';
import {
	findInlineOp,
	findPostAttributeOps,
	findStructuralOp,
	parseSuggestionPayload,
} from './operations';
import {
	SUGGESTION_CLASS_PROBE,
	SUGGESTION_ID_ATTRIBUTE,
	isSuggestionFormat,
} from '../inline-suggestions';

/**
 * The id attribute of a serialized inline marker. Matched on the serialized
 * value rather than parsed: the index below runs on every block-editor store
 * update, and every marker carries the attribute, so a match can miss no
 * marker that is present.
 */
const SUGGESTION_ID_PATTERN = /data-suggestion-id="([^"]+)"/g;

const PENDING_MARKER_BY_OP: Record< string, string > = {
	'block-remove': 'pending-remove',
	'block-insert-after': 'pending-insert',
	'block-move': 'pending-move',
};

export type SuggestionAnchor =
	| { kind: 'structural'; pendingType: string }
	| { kind: 'inline'; attribute: string };

export interface AnchorIndex {
	/** Note ids with an inline marker in any attribute of any block. */
	inline: Set< string >;
	structural: Set< string >;
}

/**
 * Describe the anchor a suggestion note must keep to stay meaningful.
 *
 * @param note Note comment record.
 * @return Anchor descriptor, or null when the note has no anchor in block
 * content (no payload, or a post-field suggestion such as the title).
 */
export function describeAnchor( note: any ): SuggestionAnchor | null {
	const payload = parseSuggestionPayload( note?.meta?._wp_suggestion );
	if ( ! payload ) {
		return null;
	}
	const structuralOp = findStructuralOp( payload.operations );
	if ( structuralOp ) {
		return {
			kind: 'structural',
			pendingType: PENDING_MARKER_BY_OP[ structuralOp.type ],
		};
	}
	const inlineOp = findInlineOp( payload.operations );
	if ( inlineOp ) {
		return { kind: 'inline', attribute: inlineOp.attribute };
	}
	if ( findPostAttributeOps( payload.operations ).length > 0 ) {
		return null;
	}
	// Attribute-set suggestions: anchored to the proposal on the block's
	// marker, whatever the marker's type (an attribute edit on a moved
	// block rides along on the move's marker).
	return { kind: 'structural', pendingType: PENDING_ATTRIBUTES };
}

/*
 * Marker ids per rich-text value. Values are immutable and an edit replaces
 * only the edited block's, so a rebuild after a keystroke scans one block's
 * formats rather than every character in the document.
 */
const markerIdsByValue = new WeakMap< RichTextData, string[] >();

function richTextMarkerIds( value: RichTextData ): string[] {
	let ids = markerIdsByValue.get( value );
	if ( ids ) {
		return ids;
	}
	const found = new Set< string >();
	// Read marker ids off the parsed formats; serializing every block's
	// content on every store update was the cost here. `RichTextData` types
	// its `formats` as `never[]`.
	const formats: RichTextValue[ 'formats' ] = value.formats;
	for ( const stack of formats ) {
		for ( const format of stack ?? [] ) {
			const id =
				isSuggestionFormat( format ) &&
				format.attributes?.[ SUGGESTION_ID_ATTRIBUTE ];
			if ( id ) {
				found.add( String( id ) );
			}
		}
	}
	ids = [ ...found ];
	markerIdsByValue.set( value, ids );
	return ids;
}

/**
 * The note ids of the inline markers in one attribute value.
 *
 * @param value Attribute value.
 * @return Marker ids; empty for anything that is not marked rich text.
 */
function attributeMarkerIds( value: unknown ): string[] {
	if ( value instanceof RichTextData ) {
		return richTextMarkerIds( value );
	}
	if (
		typeof value === 'string' &&
		value.includes( SUGGESTION_CLASS_PROBE )
	) {
		return Array.from(
			value.matchAll( SUGGESTION_ID_PATTERN ),
			( match ) => match[ 1 ]
		);
	}
	return [];
}

/**
 * Where a note's inline marker is, found by the marker's id.
 *
 * The marker travels with the text, so it is the anchor. The attribute a
 * payload names and the block a `metadata.noteId` links are only where the
 * marker was written: merging two blocks moves it under a block that never
 * had the link, and a transform can rename the attribute and drops the link.
 * Both are tried first, as hints.
 *
 * @param blockEditor    Block-editor selectors.
 * @param noteId         Note id the marker carries.
 * @param hint           Where the marker was last known to be.
 * @param hint.clientId  Block client id.
 * @param hint.attribute Attribute name.
 * @return The block and attribute holding the marker, or null.
 */
export function findInlineMarker(
	blockEditor: any,
	noteId: number | string,
	hint: { clientId?: string; attribute?: string } = {}
): { clientId: string; attribute: string } | null {
	const idKey = String( noteId );
	const inBlock = ( clientId: string ) => {
		const attributes = blockEditor.getBlockAttributes( clientId );
		if ( ! attributes ) {
			return null;
		}
		const names = Object.keys( attributes );
		if ( hint.attribute && names.includes( hint.attribute ) ) {
			names.splice( names.indexOf( hint.attribute ), 1 );
			names.unshift( hint.attribute );
		}
		for ( const attribute of names ) {
			if (
				attributeMarkerIds( attributes[ attribute ] ).includes( idKey )
			) {
				return { clientId, attribute };
			}
		}
		return null;
	};
	const hinted = hint.clientId ? inBlock( hint.clientId ) : null;
	if ( hinted ) {
		return hinted;
	}
	for ( const clientId of blockEditor.getClientIdsWithDescendants?.() ??
		[] ) {
		const found = clientId === hint.clientId ? null : inBlock( clientId );
		if ( found ) {
			return found;
		}
	}
	return null;
}

/**
 * The anchors present in the editor, indexed in one pass over the blocks.
 *
 * Structural anchors are the `metadata.suggestion` markers, keyed by pending
 * type and note id. Inline anchors are the marker ids found in the blocks'
 * rich text, whichever attribute holds them: the marker travels with content,
 * so the content is what is scanned rather than a (possibly undone) metadata
 * linkage or the attribute the note was written for, as the server does.
 * Building the index once and testing every note against it keeps a store
 * update at one pass over the blocks instead of one per note.
 *
 * @param blockEditor Block-editor selectors.
 * @param scanInline  Whether any tracked note has an inline anchor.
 * @return The index.
 */
export function buildAnchorIndex(
	blockEditor: any,
	scanInline: boolean
): AnchorIndex {
	const inline = new Set< string >();
	const structural = new Set< string >();
	for ( const clientId of blockEditor.getClientIdsWithDescendants?.() ??
		[] ) {
		const attributes = blockEditor.getBlockAttributes( clientId );
		if ( ! attributes ) {
			continue;
		}
		for ( const [ noteId, kind ] of markerAnchorKeys(
			attributes.metadata
		) ) {
			structural.add( `${ kind }:${ noteId }` );
		}
		if ( ! scanInline ) {
			continue;
		}
		for ( const value of Object.values( attributes ) ) {
			for ( const id of attributeMarkerIds( value ) ) {
				inline.add( String( id ) );
			}
		}
	}
	return { inline, structural };
}

/*
 * Index cache keyed by the block tree version, which changes on any block
 * attribute or structure change, controlled inner blocks included. Store
 * updates that leave every block alone (selection, notices, entity records)
 * reuse the last index.
 */
const anchorIndexCache = new WeakMap<
	object,
	{ scanInline: boolean; index: AnchorIndex }
>();

/**
 * `buildAnchorIndex`, cached per block tree.
 *
 * @param blockEditor Block-editor selectors.
 * @param scanInline  Whether any tracked note has an inline anchor.
 * @return The index.
 */
export function getAnchorIndex(
	blockEditor: any,
	scanInline: boolean
): AnchorIndex {
	const version = getBlockTreeVersion( blockEditor );
	const cached = version ? anchorIndexCache.get( version ) : undefined;
	// An index that scanned inline markers answers either question.
	if ( cached && ( cached.scanInline || ! scanInline ) ) {
		return cached.index;
	}
	const index = buildAnchorIndex( blockEditor, scanInline );
	if ( version ) {
		anchorIndexCache.set( version, { scanInline, index } );
	}
	return index;
}

/**
 * Whether any of the given notes is anchored by an inline marker.
 *
 * @param lists Lists of tracked notes with their anchors.
 * @return True when the blocks' rich text has to be scanned.
 */
export function hasInlineAnchor(
	...lists: Array< Iterable< { anchor: SuggestionAnchor } > >
): boolean {
	for ( const list of lists ) {
		for ( const { anchor } of list ) {
			if ( anchor.kind === 'inline' ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Whether a note's anchor is currently present in the editor.
 *
 * @param note   Note comment record.
 * @param anchor Anchor descriptor from `describeAnchor`.
 * @param index  Anchor index from `buildAnchorIndex`.
 * @return True when the anchor exists.
 */
export function isAnchorPresent(
	note: any,
	anchor: SuggestionAnchor,
	index: AnchorIndex
): boolean {
	const idKey = String( note.id );
	if ( anchor.kind === 'structural' ) {
		return index.structural.has( `${ anchor.pendingType }:${ idKey }` );
	}
	return index.inline.has( idKey );
}

/**
 * Whether a note's anchor is in the loaded content.
 *
 * @param note Note comment record.
 * @return True or false, or null when the note has no anchor in block content
 * or no blocks are loaded yet, so a caller never acts on an empty editor.
 */
export function useSuggestionAnchorPresent( note: any ): boolean | null {
	const anchor = describeAnchor( note );
	const anchorKey = anchor
		? `${ anchor.kind }:${
				anchor.kind === 'inline' ? anchor.attribute : anchor.pendingType
			}`
		: '';
	return useSelect(
		( select ) => {
			if ( ! anchor ) {
				return null;
			}
			const blockEditor = select( blockEditorStore );
			if ( ! blockEditor.getBlockCount?.() ) {
				return null;
			}
			const index = getAnchorIndex(
				blockEditor,
				hasInlineAnchor( [ { anchor } ] )
			);
			return isAnchorPresent( note, anchor, index );
		},
		// `anchor` is derived from the note's payload, keyed by `anchorKey`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ note?.id, anchorKey ]
	);
}
