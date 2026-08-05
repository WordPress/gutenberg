/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function useListViewCollapseItems( { updateExpansion } ) {
	const { expandedBlock, getBlockParents } = useSelect( ( select ) => {
		const { getBlockParents: _getBlockParents, getExpandedBlock } = unlock(
			select( blockEditorStore )
		);
		return {
			expandedBlock: getExpandedBlock(),
			getBlockParents: _getBlockParents,
		};
	}, [] );

	// Collapse all but the specified block when the expanded block client Id changes.
	useEffect( () => {
		if ( expandedBlock ) {
			const blockParents = getBlockParents( expandedBlock, false );
			// Collapse all blocks and expand the block's parents.
			updateExpansion( { type: 'replace', clientIds: blockParents } );
		}
	}, [ updateExpansion, expandedBlock, getBlockParents ] );
}
