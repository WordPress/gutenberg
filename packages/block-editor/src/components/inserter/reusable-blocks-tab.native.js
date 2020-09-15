/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';

const REUSABLE_BLOCKS_CATEGORY = 'reusable';

function ReusableBlocksTab( { onSelect, rootClientId, listProps } ) {
	const { items } = useSelect(
		( select ) => {
			const { getInserterItems } = select( 'core/block-editor' );
			const allItems = getInserterItems( rootClientId );
			const reusableBlockItems = allItems.filter(
				( { category } ) => category === REUSABLE_BLOCKS_CATEGORY
			);

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
