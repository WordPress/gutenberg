import { parse, type Block } from '@wordpress/blocks';
import { RichTextData, removeFormat, toHTMLString } from '@wordpress/rich-text';
import { NOTE_FORMAT_NAME } from './constants';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
	type NoteMetadata,
} from './utils/metadata';
import { findNoteInBlock, wrapInlineNote } from './utils/note-anchor';
import { toRecord } from './utils/rich-text';
import type { BlockAttributes } from './utils/types';

type NoteBlock = Block< BlockAttributes >;

interface Note {
	id: number;
	parent: number;
	// The blocks the note was added to: their index path and serialized
	// content, which carries the `new` draft marker of an inline note.
	meta?: { _wp_note_anchor?: { path: number[]; content: string }[] };
}

/**
 * A block's name and attributes without its note anchors, so two blocks
 * compare equal when only their notes differ.
 *
 * @param block Block to describe.
 */
function getSignature( block: NoteBlock ) {
	const { metadata, ...rest } = block.attributes;
	const { noteId, ...otherMetadata } = ( metadata ?? {} ) as NoteMetadata;
	for ( const [ key, value ] of Object.entries( rest ) ) {
		if ( value instanceof RichTextData ) {
			rest[ key ] = toHTMLString( {
				value: removeFormat(
					toRecord( value ),
					NOTE_FORMAT_NAME,
					0,
					value.text.length
				),
			} );
		}
	}
	return JSON.stringify( [ block.name, rest, otherMetadata ] );
}

function flattenBlocks(
	blocks: NoteBlock[],
	parentPath: number[] = []
): { block: NoteBlock; path: string }[] {
	return blocks.flatMap( ( block, index ) => {
		const path = [ ...parentPath, index ];
		return [
			{ block, path: path.join( '.' ) },
			...flattenBlocks( block.innerBlocks, path ),
		];
	} );
}

/**
 * Finds where the notes no block points to belong, from the blocks stored
 * with them when they were added.
 *
 * A note is placed only on a block that still matches its stored one: the
 * block at the same position, otherwise the only one in the content. Anything
 * less certain leaves the note orphaned, since a note on the wrong block is
 * worse than no block at all.
 *
 * @param notes  Note records.
 * @param blocks The current blocks.
 * @return Attribute changes to apply, keyed by block client id.
 */
export function findNoteAnchors(
	notes: Note[],
	blocks: NoteBlock[]
): Record< string, BlockAttributes > {
	const result: Record< string, BlockAttributes > = {};
	const current = flattenBlocks( blocks );
	const anchored = new Set(
		current.flatMap( ( { block } ) =>
			getNoteIdsFromMetadata( block.attributes.metadata as NoteMetadata )
		)
	);

	for ( const { id, parent, meta } of notes ) {
		if ( parent || anchored.has( id ) ) {
			continue;
		}
		for ( const { path, content } of meta?._wp_note_anchor ?? [] ) {
			const [ source ] = parse( content ) as NoteBlock[];
			if ( ! source ) {
				continue;
			}
			const signature = getSignature( source );
			const matches = current.filter(
				( { block } ) => getSignature( block ) === signature
			);
			const target =
				matches.find( ( match ) => match.path === path.join( '.' ) ) ??
				( matches.length === 1 ? matches[ 0 ] : undefined );
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
			result[ clientId ] = {
				...result[ clientId ],
				metadata: addNoteIdToMetadata(
					attributes.metadata as NoteMetadata,
					id
				),
			};

			// The text matches the stored block's once markers are stripped,
			// so the draft marker's offsets apply to the current text too.
			const draft = findNoteInBlock( source.attributes, 'new' );
			const wrapped =
				draft &&
				wrapInlineNote(
					attributes[ draft.attributeKey ],
					id,
					draft.start,
					draft.end
				);
			if ( draft && wrapped ) {
				result[ clientId ][ draft.attributeKey ] = wrapped;
			}
		}
	}
	return result;
}
