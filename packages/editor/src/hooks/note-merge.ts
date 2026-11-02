import { addFilter } from '@wordpress/hooks';
import type { BlockType } from '@wordpress/blocks';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
} from '../components/collab-sidebar/utils';

type Metadata = Record< string, unknown >;

/**
 * Wraps a block type's `merge` callback so that the notes of the merged block
 * are kept.
 *
 * @param settings Block type settings.
 * @return Filtered block type settings.
 */
export function addNoteMergeCallback( settings: BlockType ): BlockType {
	const { merge } = settings;

	// Blocks without `merge` can't be merged, so leave them as they are.
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

			// The merged attributes are shallowly spread over the first block's
			// attributes, so build on its metadata to keep the rest of it.
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

addFilter(
	'blocks.registerBlockType',
	'core/editor/notes/merge',
	addNoteMergeCallback
);
