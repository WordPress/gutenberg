import { parse, type Block } from '@wordpress/blocks';
import { create, RichTextData, toHTMLString } from '@wordpress/rich-text';
import {
	addNoteIdToMetadata,
	applyNoteFormat,
	findNoteInBlock,
	getNoteIdsFromMetadata,
} from './utils';

const NOTE_FORMAT_TYPE = 'core/note';

type Attributes = Record< string, any >;

type FlatBlock = {
	block: Block< Attributes >;
	path: string;
	signature: string;
};

export type Autosave = {
	content?: string | { raw?: string };
	modified_gmt?: string;
};

export type AutosaveAnchors = {
	/** Attribute changes to apply, keyed by block client id. */
	attributesByClientId: Record< string, Attributes >;
	/** Ids of the notes that were placed. */
	noteIds: number[];
};

type RichTextRecord = ReturnType< typeof create >;

function toRichTextRecord( value: unknown ): RichTextRecord | null {
	if ( value instanceof RichTextData ) {
		return create( { html: value.toHTMLString() } );
	}
	if ( typeof value === 'string' && value.includes( 'wp-note' ) ) {
		return create( { html: value } );
	}
	return null;
}

function toRichTextData( record: RichTextRecord ) {
	// Round-trip through HTML to normalise format references, so the value
	// matches what a fresh load of the post produces.
	return RichTextData.fromHTMLString( toHTMLString( { value: record } ) );
}

/**
 * Returns an attribute value with every `core/note` marker removed, so two
 * blocks compare equal when only their note markers differ.
 *
 * @param value Block attribute value.
 */
function stripNoteMarkers( value: unknown ): unknown {
	const record = toRichTextRecord( value );
	if ( ! record ) {
		return value instanceof RichTextData ? value.toHTMLString() : value;
	}
	const formats = record.formats.map( ( stack ) => {
		const kept = stack?.filter(
			( format ) => format.type !== NOTE_FORMAT_TYPE
		);
		return kept?.length ? kept : undefined;
	} );
	return toHTMLString( {
		value: { ...record, formats: formats as RichTextRecord[ 'formats' ] },
	} );
}

/**
 * A block's identity with its note anchors left out: its name and its
 * attributes, minus `metadata.noteId` and inline note markers.
 *
 * @param block Block to describe.
 */
function getSignature( block: Block< Attributes > ) {
	const attributes: Attributes = {};
	for ( const [ key, value ] of Object.entries( block.attributes ) ) {
		if ( key === 'metadata' ) {
			const { noteId, ...metadata } = ( value ?? {} ) as Attributes;
			if ( Object.keys( metadata ).length ) {
				attributes.metadata = metadata;
			}
			continue;
		}
		attributes[ key ] = stripNoteMarkers( value );
	}
	return JSON.stringify( [ block.name, attributes ] );
}

function flattenBlocks(
	blocks: Block< Attributes >[],
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
		flattenBlocks(
			( block.innerBlocks ?? [] ) as Block< Attributes >[],
			path,
			result
		);
	} );
	return result;
}

function getAutosaveContent( autosave: Autosave ) {
	return typeof autosave.content === 'string'
		? autosave.content
		: ( autosave.content?.raw ?? '' );
}

/**
 * Finds where orphaned notes belong, using the current user's autosave.
 *
 * A note is placed only when the autosave is newer than the post, holds a
 * block carrying the note's id, and that same block can be found in the
 * current content: first at the same position, otherwise as the only block
 * with the same name and attributes. Anything less certain leaves the note
 * orphaned, since a note on the wrong block is worse than no block at all.
 *
 * @param args                 Arguments.
 * @param args.orphanNoteIds   Ids of top-level notes no block points to.
 * @param args.autosave        The current user's autosave, if any.
 * @param args.postModifiedGmt The post's `modified_gmt`.
 * @param args.blocks          The current blocks.
 */
export function findAutosaveAnchors( {
	orphanNoteIds,
	autosave,
	postModifiedGmt,
	blocks,
}: {
	orphanNoteIds: number[];
	autosave?: Autosave | null;
	postModifiedGmt?: string;
	blocks: Block< Attributes >[];
} ): AutosaveAnchors {
	const result: AutosaveAnchors = { attributesByClientId: {}, noteIds: [] };
	if (
		! orphanNoteIds.length ||
		! autosave?.modified_gmt ||
		( postModifiedGmt && autosave.modified_gmt <= postModifiedGmt )
	) {
		return result;
	}

	const autosaveBlocks = flattenBlocks(
		parse( getAutosaveContent( autosave ) ) as Block< Attributes >[]
	);
	const currentBlocks = flattenBlocks( blocks );
	const currentByPath = new Map(
		currentBlocks.map( ( entry ) => [ entry.path, entry ] )
	);

	for ( const noteId of orphanNoteIds ) {
		const source = autosaveBlocks.find( ( { block } ) =>
			getNoteIdsFromMetadata( block.attributes.metadata ).includes(
				noteId
			)
		);
		if ( ! source ) {
			continue;
		}

		let target = currentByPath.get( source.path );
		if ( target?.signature !== source.signature ) {
			const candidates = currentBlocks.filter(
				( entry ) => entry.signature === source.signature
			);
			target = candidates.length === 1 ? candidates[ 0 ] : undefined;
		}
		if ( ! target ) {
			continue;
		}

		const { clientId } = target.block;
		// Build on earlier matches for the same block, so two notes placed
		// on one block don't overwrite each other.
		const attributes = {
			...target.block.attributes,
			...result.attributesByClientId[ clientId ],
		};
		if (
			getNoteIdsFromMetadata( attributes.metadata ).includes( noteId )
		) {
			continue;
		}

		const patch: Attributes = {
			...result.attributesByClientId[ clientId ],
			metadata: addNoteIdToMetadata( attributes.metadata, noteId ),
		};

		// The text matches the autosave once markers are stripped, so the
		// marker's offsets from the autosave apply to the current text too.
		const inline = findNoteInBlock( source.block.attributes, noteId );
		const record =
			inline && attributes[ inline.attributeKey ] instanceof RichTextData
				? create( {
						html: attributes[ inline.attributeKey ].toHTMLString(),
					} )
				: null;
		if ( inline && record ) {
			patch[ inline.attributeKey ] = toRichTextData(
				applyNoteFormat(
					record,
					{
						type: NOTE_FORMAT_TYPE,
						attributes: { 'data-id': String( noteId ) },
					},
					inline.start,
					inline.end
				) as RichTextRecord
			);
		}

		result.attributesByClientId[ clientId ] = patch;
		result.noteIds.push( noteId );
	}

	return result;
}
