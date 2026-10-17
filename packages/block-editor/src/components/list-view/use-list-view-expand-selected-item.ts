import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import type { UpdateListViewExpansion } from './types';

export default function useListViewExpandSelectedItem( {
	firstSelectedBlockClientId,
	updateExpansion,
}: {
	firstSelectedBlockClientId: string;
	updateExpansion: UpdateListViewExpansion;
} ) {
	const [ selectedTreeId, setSelectedTreeId ] = useState<
		string | undefined | null
	>( null );
	const { selectedBlockParentClientIds } = useSelect(
		( select ) => {
			const { getBlockParents } = select( blockEditorStore );
			return {
				selectedBlockParentClientIds: getBlockParents(
					firstSelectedBlockClientId,
					false
				),
			};
		},
		[ firstSelectedBlockClientId ]
	);

	// Expand tree when a block is selected.
	useEffect( () => {
		// If the selectedTreeId is the same as the selected block,
		// it means that the block was selected using the block list tree.
		if ( selectedTreeId === firstSelectedBlockClientId ) {
			return;
		}

		// If the selected block has parents, get the top-level parent.
		if ( selectedBlockParentClientIds?.length ) {
			// If the selected block has parents,
			// expand the tree branch.
			updateExpansion( {
				type: 'expand',
				clientIds: selectedBlockParentClientIds,
			} );
		}
	}, [
		firstSelectedBlockClientId,
		selectedBlockParentClientIds,
		selectedTreeId,
		updateExpansion,
	] );

	return {
		setSelectedTreeId,
	};
}
