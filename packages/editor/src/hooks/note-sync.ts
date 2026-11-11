import { addFilter } from '@wordpress/hooks';
import type { BlockType } from '@wordpress/blocks';

/**
 * Declares the note IDs of a block as a list of unique items.
 *
 * During real-time collaboration, this keeps the notes of every collaborator
 * when several of them add or remove notes on the same block at the same
 * time. Without it, one collaborator's list of note IDs replaces the other's.
 *
 * The declaration lives here, with the other note hooks, because the block
 * editor adds the `metadata` attribute without knowing about notes.
 *
 * @example
 * ```js
 * addNoteIdSchema( {
 *     name: 'core/paragraph',
 *     attributes: { metadata: { type: 'object' } },
 * } );
 * // => {
 * //     name: 'core/paragraph',
 * //     attributes: {
 * //         metadata: {
 * //             type: 'object',
 * //             properties: {
 * //                 noteId: {
 * //                     type: 'array',
 * //                     items: { type: 'number' },
 * //                     uniqueItems: true,
 * //                 },
 * //             },
 * //         },
 * //     },
 * // }
 * ```
 *
 * @param settings Block type settings.
 * @return Filtered block type settings.
 */
export function addNoteIdSchema( settings: BlockType ): BlockType {
	const metadata = settings.attributes.metadata;

	return {
		...settings,
		attributes: {
			...settings.attributes,
			metadata: {
				type: 'object',
				...metadata,
				properties: {
					...metadata?.properties,
					noteId: {
						type: 'array',
						items: { type: 'number' },
						uniqueItems: true,
					},
				},
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/notes/addNoteIdSchema',
	addNoteIdSchema
);
