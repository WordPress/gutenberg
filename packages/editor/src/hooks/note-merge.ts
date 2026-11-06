import { addFilter } from '@wordpress/hooks';
import type { Block, BlockType } from '@wordpress/blocks';
import { getNoteIdsFromMetadata } from '../components/collab-sidebar/utils/metadata';
import type { NoteMetadata } from '../components/collab-sidebar/utils/metadata';

/**
 * Adds the note IDs of one metadata object to another.
 *
 * @param metadata        Metadata to add the note IDs to.
 * @param metadataToMerge Metadata whose note IDs are added.
 * @return Merged metadata, or `undefined` when no note IDs are added.
 */
function mergeNoteIds(
	metadata: unknown,
	metadataToMerge: unknown
): NoteMetadata | undefined {
	const current = metadata as NoteMetadata | undefined;
	const noteIds = getNoteIdsFromMetadata( current );
	const mergedIds = new Set( [
		...noteIds,
		...getNoteIdsFromMetadata(
			metadataToMerge as NoteMetadata | undefined
		),
	] );
	if ( mergedIds.size === noteIds.length ) {
		return;
	}
	return { ...current, noteId: [ ...mergedIds ] };
}

/**
 * Wraps a block type's `merge` callback so that the notes of the merged block
 * are kept.
 *
 * @param settings Block type settings.
 * @return Filtered block type settings.
 */
export function addMergeCallback( settings: BlockType ): BlockType {
	const { merge } = settings;

	if ( ! merge ) {
		return settings;
	}

	return {
		...settings,
		merge( attributes, attributesToMerge ) {
			const result = merge( attributes, attributesToMerge );
			const metadata = mergeNoteIds(
				result.metadata ?? attributes.metadata,
				attributesToMerge.metadata
			);
			return metadata ? { ...result, metadata } : result;
		},
	};
}

/**
 * Keeps the notes of the source blocks when blocks are switched to another
 * block type.
 *
 * @param result  Transformed block.
 * @param source  Source block or blocks.
 * @param index   Index of the transformed block.
 * @param results All blocks that resulted from the transformation.
 * @return Transformed block with the source block's notes.
 */
export function addTransforms(
	result: Block,
	source: Block | Block[],
	index: number,
	results: Block[]
): Block {
	const sources = Array.isArray( source ) ? source : [ source ];
	const isWrapping =
		results.length === 1 && result.innerBlocks.length === sources.length;
	if ( isWrapping || results.length !== sources.length ) {
		return result;
	}

	const metadata = mergeNoteIds(
		result.attributes.metadata,
		sources[ index ].attributes.metadata
	);
	return metadata
		? { ...result, attributes: { ...result.attributes, metadata } }
		: result;
}

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/notes/addTransforms',
	addTransforms
);

addFilter(
	'blocks.registerBlockType',
	'core/notes/addMergeCallback',
	addMergeCallback
);
