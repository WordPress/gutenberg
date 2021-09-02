/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import { store as blockEditorStore } from '../../store';

function ReusableBlocksTab( {
	onSelect,
	rootClientId,
	listProps,
	allowedBlockFilter = () => true,
} ) {
	const blockFilter = useCallback( ( block ) =>
		allowedBlockFilter( block, { onlyReusable: true } )
	);

	const { items } = useSelect(
		( select ) => {
			const { getInserterItems } = select( blockEditorStore );
			const allItems = getInserterItems( rootClientId );
			const reusableBlockItems = allItems.filter( blockFilter );

			return { items: reusableBlockItems };
		},
		[ rootClientId ]
	);

	return (
		<BlockTypesList
			name="ReusableBlocks"
			items={ items }
			onSelect={ onSelect }
			listProps={ listProps }
		/>
	);
}

export default ReusableBlocksTab;
