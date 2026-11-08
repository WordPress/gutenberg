import { parse, type Block } from '@wordpress/blocks';
import {
	RichTextData,
	toHTMLString,
	type RichTextValue,
} from '@wordpress/rich-text';
import { NOTE_FORMAT_NAME } from './constants';
import { addNoteIdToMetadata } from './utils/metadata';
import { findNoteInBlock } from './utils/note-anchor';
import { applyNoteFormat } from './utils/note-format';
import { toAttribute, toRecord } from './utils/rich-text';
import type { BlockAttributes } from './utils/types';

/**
 * A block a note was added to, as stored in the note's `_wp_note_anchor`
 * meta: its position in the block tree and its serialized content, which
 * carries the `new` draft marker of an inline note.
 */
export interface NoteAnchorSnapshot {
	path: number[];
	content: string;
}

export interface OrphanedNote {
	id: number;
	anchors: NoteAnchorSnapshot[];
}

interface FlatBlock {
	block: Block< BlockAttributes >;
	path: string;
	signature: string;
}

/**
 * A rich text value as HTML with every `core/note` marker removed, so two
 * blocks compare equal when only their note markers differ.
 *
 * @param value Block attribute value.
 */
function stripNoteMarkers( value: unknown ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const record = toRecord( value );
	const formats = record.formats.map( ( stack ) => {
		const kept = stack?.filter( ( { type } ) => type !== NOTE_FORMAT_NAME );
		return kept?.length ? kept : undefined;
	} ) as RichTextValue[ 'formats' ];
	return toHTMLString( { value: { ...record, formats } } );
}

/**
 * A block's identity with its note anchors left out: its name and
 * attributes, minus `metadata.noteId` and inline note markers.
 *
 * @param block Block to describe.
 */
function getSignature( block: Block< BlockAttributes > ) {
	const { name, attributes } = block;
	const rest: BlockAttributes = {};
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( key === 'metadata' ) {
			const { noteId, ...metadata } = ( value ?? {} ) as BlockAttributes;
			if ( Object.keys( metadata ).length ) {
				rest.metadata = metadata;
			}
		} else {
			rest[ key ] = stripNoteMarkers( value );
		}
	}
	return JSON.stringify( [ name, rest ] );
}

function flattenBlocks(
	blocks: Block< BlockAttributes >[],
	parentPath: number[] = [],
	result: FlatBlock[] = []
) {
	blocks.forEach( ( block, index ) => {
		const path = [ ...parentPath, index ];
		result.push( {
			block,
			path: path.join( '.' ),
			signature: getSignature( block ),
		} );
		flattenBlocks( block.innerBlocks ?? [], path, result );
	} );
	return result;
}

/**
 * Finds where orphaned notes belong from the snapshots taken when they were
 * added.
 *
 * A note is placed only when its snapshot block can be found in the current
 * content: at the same position, otherwise as the only block with the same
 * name and attributes once note anchors are stripped. Anything less certain
 * leaves the note orphaned, since a note on the wrong block is worse than no
 * block at all.
 *
 * @param orphans Top-level notes no block points to, with their snapshots.
 * @param blocks  The current blocks.
 * @return Attribute changes to apply, keyed by block client id.
 */
export function findNoteAnchors(
	orphans: OrphanedNote[],
	blocks: Block< BlockAttributes >[]
): Record< string, BlockAttributes > {
	const result: Record< string, BlockAttributes > = {};
	const current = flattenBlocks( blocks );
	const currentByPath = new Map(
		current.map( ( entry ) => [ entry.path, entry ] )
	);

	for ( const { id, anchors } of orphans ) {
		for ( const anchor of anchors ) {
			const [ source ] = parse(
				anchor.content
			) as Block< BlockAttributes >[];
			if ( ! source ) {
				continue;
			}
			const signature = getSignature( source );
			let target = currentByPath.get( anchor.path.join( '.' ) );
			if ( target?.signature !== signature ) {
				const candidates = current.filter(
					( entry ) => entry.signature === signature
				);
				target = candidates.length === 1 ? candidates[ 0 ] : undefined;
			}
			if ( ! target ) {
				continue;
			}

			// Build on earlier matches for the same block, so two notes placed
			// on one block don't overwrite each other.
			const { clientId } = target.block;
			const attributes = {
				...target.block.attributes,
				...result[ clientId ],
			};
			const patch: BlockAttributes = {
				...result[ clientId ],
				metadata: addNoteIdToMetadata(
					attributes.metadata as BlockAttributes,
					id
				),
			};

			// The text matches the snapshot once markers are stripped, so the
			// draft marker's offsets apply to the current text too.
			const inline = findNoteInBlock( source.attributes, 'new' );
			const value = inline && attributes[ inline.attributeKey ];
			if ( inline && value instanceof RichTextData ) {
				patch[ inline.attributeKey ] = toAttribute(
					applyNoteFormat(
						toRecord( value ),
						{
							type: NOTE_FORMAT_NAME,
							attributes: { 'data-id': String( id ) },
						},
						inline.start,
						inline.end
					),
					value
				);
			}
			result[ clientId ] = patch;
		}
	}
	return result;
}
