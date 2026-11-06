import { addFilter } from '@wordpress/hooks';
import type { Block, BlockType } from '@wordpress/blocks';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
} from '../components/collab-sidebar/utils/metadata';

type Metadata = Record< string, unknown >;

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
			const noteIds: number[] = getNoteIdsFromMetadata(
				attributesToMerge.metadata ?? {}
			);
			if ( noteIds.length === 0 ) {
				return result;
			}

			const metadata = ( result.metadata ??
				attributes.metadata ??
				{} ) as Metadata;
			const mergedMetadata = noteIds.reduce(
				( current, noteId ) =>
					addNoteIdToMetadata( current, noteId ) as Metadata,
				metadata
			);
			return mergedMetadata === metadata
				? result
				: { ...result, metadata: mergedMetadata };
		},
	};
}

/**
 * Keeps the notes of a single block when it's switched to another block type.
 * Blocks of different types are merged by switching the second block first,
 * and a block switched on its own reaches the filter as a block instead of an
 * array, so its metadata isn't kept.
 *
 * @param result Transformed block.
 * @param source Source block or blocks.
 * @return Transformed block with the source block's notes.
 */
export function addTransforms( result: Block, source: Block | Block[] ): Block {
	if ( Array.isArray( source ) ) {
		return result;
	}

	const noteIds: number[] = getNoteIdsFromMetadata(
		source.attributes?.metadata ?? {}
	);
	if ( noteIds.length === 0 ) {
		return result;
	}

	const metadata = ( result.attributes?.metadata ?? {} ) as Metadata;
	const mergedMetadata = noteIds.reduce(
		( current, noteId ) =>
			addNoteIdToMetadata( current, noteId ) as Metadata,
		metadata
	);
	return mergedMetadata === metadata
		? result
		: {
				...result,
				attributes: { ...result.attributes, metadata: mergedMetadata },
			};
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
