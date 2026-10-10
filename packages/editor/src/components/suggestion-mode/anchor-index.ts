/**
 * Where each suggestion note is anchored in the loaded content, and whether
 * that anchor is still there.
 *
 * Every suggestion note is held by something in block content: an inline
 * `<mark class="wp-suggestion">` marker, a structural `metadata.suggestion`
 * marker on a block, or an attribute proposal in that marker's `after`. The
 * note collector watches anchors disappear; the sidebar asks whether a
 * decided note's anchor is still present, which means the decision did not
 * reach the post. The server keeps the same rules in
 * `gutenberg_get_suggestion_anchor_index()`.
 */
import { useSelect } from '@wordpress/data';
import { RichTextData } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockTreeVersion } from './block-tree-version';
import {
	PENDING_ATTRIBUTES,
	proposedAttributes,
	readSuggestionMarker,
} from './marker';
import {
	findInlineOp,
	findPostAttributeOps,
	findStructuralOp,
	parseSuggestionPayload,
} from './operations';
import {
	SUGGESTION_CLASS,
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_ID_ATTRIBUTE,
} from '../inline-suggestions';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils';

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
	inline: Map< string, Set< string > >;
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

/**
 * The anchors present in the editor, indexed in one pass over the blocks.
 *
 * Structural anchors are the `metadata.suggestion` markers, keyed by pending
 * type and note id. Inline anchors are the marker ids found in each block's
 * rich-text attributes, keyed by attribute: the marker travels with content,
 * so the content is what is scanned rather than a (possibly undone) metadata
 * linkage. Building the index once and testing every note against it keeps a
 * store update at one serialization per block instead of one per note.
 *
 * @param blockEditor      Block-editor selectors.
 * @param inlineAttributes Attribute names any tracked inline note anchors to.
 * @return The index.
 */
export function buildAnchorIndex(
	blockEditor: any,
	inlineAttributes: Set< string >
): AnchorIndex {
	const inline = new Map< string, Set< string > >();
	const structural = new Set< string >();
	for ( const clientId of blockEditor.getClientIdsWithDescendants?.() ??
		[] ) {
		const attributes = blockEditor.getBlockAttributes( clientId );
		if ( ! attributes ) {
			continue;
		}
		const marker = readSuggestionMarker( attributes );
		if ( marker ) {
			for ( const noteId of getNoteIdsFromMetadata(
				attributes.metadata
			) ) {
				structural.add( `${ marker.type }:${ noteId }` );
				if ( proposedAttributes( marker ) ) {
					structural.add( `${ PENDING_ATTRIBUTES }:${ noteId }` );
				}
			}
		}
		for ( const attribute of inlineAttributes ) {
			const value = attributes[ attribute ];
			const addId = ( id: unknown ) => {
				let ids = inline.get( attribute );
				if ( ! ids ) {
					ids = new Set();
					inline.set( attribute, ids );
				}
				ids.add( String( id ) );
			};
			if ( value instanceof RichTextData ) {
				// Read marker ids off the parsed formats; serializing every
				// block's content on every store update was the cost here.
				// `RichTextData` types its `formats` as `never[]`.
				const formats: RichTextValue[ 'formats' ] = value.formats;
				for ( const stack of formats ) {
					for ( const format of stack ?? [] ) {
						const id =
							format.type === SUGGESTION_FORMAT_NAME &&
							format.attributes?.[ SUGGESTION_ID_ATTRIBUTE ];
						if ( id ) {
							addId( id );
						}
					}
				}
			} else if (
				typeof value === 'string' &&
				value.includes( SUGGESTION_CLASS )
			) {
				for ( const match of value.matchAll( SUGGESTION_ID_PATTERN ) ) {
					addId( match[ 1 ] );
				}
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
	{ key: string; index: AnchorIndex }
>();

/**
 * `buildAnchorIndex`, cached per block tree and attribute set.
 *
 * @param blockEditor      Block-editor selectors.
 * @param inlineAttributes Attribute names any tracked inline note anchors to.
 * @return The index.
 */
export function getAnchorIndex(
	blockEditor: any,
	inlineAttributes: Set< string >
): AnchorIndex {
	const version = getBlockTreeVersion( blockEditor );
	const key = [ ...inlineAttributes ].sort().join( '|' );
	const cached = version ? anchorIndexCache.get( version ) : undefined;
	if ( cached && cached.key === key ) {
		return cached.index;
	}
	const index = buildAnchorIndex( blockEditor, inlineAttributes );
	if ( version ) {
		anchorIndexCache.set( version, { key, index } );
	}
	return index;
}

/**
 * The rich-text attributes the given notes' inline anchors live in.
 *
 * @param lists Lists of tracked notes with their anchors.
 * @return Attribute names.
 */
export function inlineAttributesOf(
	...lists: Array< Iterable< { anchor: SuggestionAnchor } > >
): Set< string > {
	const attributes = new Set< string >();
	for ( const list of lists ) {
		for ( const { anchor } of list ) {
			if ( anchor.kind === 'inline' ) {
				attributes.add( anchor.attribute );
			}
		}
	}
	return attributes;
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
	return index.inline.get( anchor.attribute )?.has( idKey ) ?? false;
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
				inlineAttributesOf( [ { anchor } ] )
			);
			return isAnchorPresent( note, anchor, index );
		},
		// `anchor` is derived from the note's payload, keyed by `anchorKey`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ note?.id, anchorKey ]
	);
}
