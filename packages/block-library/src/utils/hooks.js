/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import queryMetaData from '../query/block.json';
const { name: queryBlockName } = queryMetaData;

/**
 * Hook that determines if a Post block will be rendered in
 * `readonly` mode or not.
 *
 * Is checking if the current user has edit rights and if the
 * Post block is nested in a Query Loop block (if it is, the
 * block should not be editable).
 *
 * @param {string} clientId The ID of the block to be checked.
 * @param {number} postId   The id of the post.
 * @param {string} postType The type of the post.
 *
 * @return {boolean} Whether the block will be rendered in `readonly` mode.
 */
export function useIsEditablePostBlock( clientId, postId, postType ) {
	const userCanEdit = useCanUserEditPostBlock( postId, postType );
	return useSelect(
		( select ) => {
			const { getBlockParents, getBlockName } = select(
				blockEditorStore
			);
			const blockParents = getBlockParents( clientId );
			const hasQueryParent = blockParents.some(
				( parentClientId ) =>
					getBlockName( parentClientId ) === queryBlockName
			);
			return userCanEdit && ! hasQueryParent;
		},
		[ clientId, userCanEdit ]
	);
}

/**
 * Hook that determines if current user has edit rights to the
 * Post block. This is different from `useIsEditablePostBlock`
 * hook which incoorporates more checks about the `readonOnly`
 * mode and we have to take account for protected content.
 *
 * @param {number} postId   The id of the post.
 * @param {string} postType The type of the post.
 *
 * @return {boolean} Whether the user has edit rights.
 */
export function useCanUserEditPostBlock( postId, postType ) {
	return useSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord(
				'root',
				'postType',
				postType,
				postId
			),
		[ postId, postType ]
	);
}

export default { useIsEditablePostBlock, useCanUserEditPostBlock };
