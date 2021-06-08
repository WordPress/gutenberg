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
