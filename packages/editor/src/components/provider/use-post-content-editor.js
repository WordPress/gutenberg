/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import serializeBlocks from '../../store/utils/serialize-blocks';

/**
 * This hook provides the required props to edit the "content" of a given postType and postId.
 *
 * @param {string} postType Post Type.
 * @param {string} postId   Post Id.
 *
 * @return {Object} BlockEditorProvider props.
 */
function usePostContentEditor( postType, postId ) {
	const blocks = useSelect(
		( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			return getEditedEntityRecord( 'postType', postType, postId ).blocks;
		},
		[ postType, postId ]
	);
	const { __unstableCreateUndoLevel, editEntityRecord } = useDispatch(
		coreStore
	);

	const onChange = useCallback(
		( newBlocks, options ) => {
			const {
				__unstableShouldCreateUndoLevel,
				selectionStart,
				selectionEnd,
			} = options;
			const edits = { blocks: newBlocks, selectionStart, selectionEnd };

			if ( __unstableShouldCreateUndoLevel !== false ) {
				const noChange = blocks === edits.blocks;
				if ( noChange ) {
					return __unstableCreateUndoLevel(
						'postType',
						postType,
						postId
					);
				}

				// We create a new function here on every persistent edit
				// to make sure the edit makes the post dirty and creates
				// a new undo level.
				edits.content = ( { blocks: blocksForSerialization = [] } ) =>
					serializeBlocks( blocksForSerialization );
			}

			editEntityRecord( 'postType', postType, postId, edits );
		},
		[ blocks, postId, postType ]
	);

	const onInput = useCallback(
		( newBlocks, options ) => {
			onChange( newBlocks, {
				...options,
				__unstableShouldCreateUndoLevel: false,
			} );
		},
		[ onChange ]
	);

	return { value: blocks, onChange, onInput };
}

export default usePostContentEditor;
