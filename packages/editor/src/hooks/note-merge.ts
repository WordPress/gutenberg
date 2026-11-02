import { addFilter } from '@wordpress/hooks';
import type { BlockType } from '@wordpress/blocks';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
} from '../components/collab-sidebar/utils';

type Attributes = Record< string, unknown > & {
	metadata?: Record< string, unknown >;
};

type MergeCallback = (
	attributes: Attributes,
	attributesToMerge: Attributes
) => Attributes;

/**
 * Wraps a block type's `merge` callback so that the notes of the merged block
 * are kept. A block type's `merge` only returns its own attributes, so the
 * merged block would otherwise lose the second block's notes while their
 * inline markers move with the text.
 *
 * @param settings Block type settings.
 * @return Filtered block type settings.
 */
export function addNoteMergeCallback( settings: BlockType ): BlockType {
	const merge = ( settings as { merge?: unknown } ).merge;

	// Blocks without `merge` can't be merged, so leave them as they are.
	if ( typeof merge !== 'function' ) {
		return settings;
	}

	const mergeWithNotes: MergeCallback = ( attributes, attributesToMerge ) => {
		const result = ( merge as MergeCallback )(
			attributes,
			attributesToMerge
		);
		const noteIds: number[] = getNoteIdsFromMetadata(
			attributesToMerge?.metadata ?? {}
		);
		if ( ! result || noteIds.length === 0 ) {
			return result;
		}

		// The merged attributes are shallowly spread over the first block's
		// attributes, so build on its metadata to keep the rest of it.
		const metadata = result.metadata ?? attributes?.metadata ?? {};
		const mergedMetadata = noteIds.reduce< Attributes[ 'metadata' ] >(
			( current, noteId ) =>
				addNoteIdToMetadata(
					current ?? {},
					noteId
				) as Attributes[ 'metadata' ],
			metadata
		);
		return mergedMetadata === metadata
			? result
			: { ...result, metadata: mergedMetadata };
	};

	return { ...settings, merge: mergeWithNotes } as BlockType;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/notes/merge',
	addNoteMergeCallback
);
