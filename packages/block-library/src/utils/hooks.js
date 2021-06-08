/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import queryMetaData from '../query/block.json';
const { name: queryBlockName } = queryMetaData;

/**
 * Hook that determines if a Post block is editable or not.
 * The returned value is used to determine if the specific
 * Post block will be rendered in `readonly` mode or not.
 *
 * For now this is checking if a Post block is nested in
 * a Query block. If it is, the block should not be editable.
 *
 * @param {string} clientId The ID of the block to be checked.
 * @return {boolean} Whether the block can be edited or not.
 */
export function useIsEditablePostBlock( clientId ) {
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
			return ! hasQueryParent;
		},
		[ clientId ]
	);
}

export default { useIsEditablePostBlock };
