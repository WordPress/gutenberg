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
 * Hook that determines if a Post block is descendent
 * of Query Loop block. If it is, the block should
 * not be rendered in `readonly` mode.
 *
 * @param {string} clientId The ID of the block to be checked.
 * @return {boolean} Whether the block is descendent of Query Loop block.
 */
export function useIsDescendentOfQueryLoopBlock( clientId ) {
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
			return hasQueryParent;
		},
		[ clientId ]
	);
}

/**
 * Returns whether the current user can edit the given entity.
 *
 * @param {string} kind     Entity kind.
 * @param {string} name     Entity name.
 * @param {number} key      Record's key.
 * @param {string} recordId Record's id.
 */
export function useCanEditEntity( kind, name, key, recordId ) {
	return useSelect(
		( select ) =>
			select( coreStore ).canUserEditEntityRecord(
				kind,
				name,
				key,
				recordId
			),
		[ kind, name, key, recordId ]
	);
}

export default {
	useIsDescendentOfQueryLoopBlock,
	useCanEditEntity,
};
