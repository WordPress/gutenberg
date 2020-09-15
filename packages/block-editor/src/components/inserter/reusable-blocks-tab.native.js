/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';

const REUSABLE_BLOCKS_CATEGORY = 'reusable';

function ReusableBlocksTab( { onSelect, rootClientId, listProps } ) {
	const { items, fetchReusableBlocks } = useSelect(
		( select ) => {
			const { getInserterItems, getSettings } = select(
				'core/block-editor'
			);
			const { __experimentalFetchReusableBlocks } = getSettings();
			const allItems = getInserterItems( rootClientId );
			const items = allItems.filter(
				( { category } ) => category === REUSABLE_BLOCKS_CATEGORY
			);

			return {
				items,
				fetchReusableBlocks: __experimentalFetchReusableBlocks,
			};
		},
		[ rootClientId ]
	);

	useEffect( () => {
		if ( fetchReusableBlocks ) {
			fetchReusableBlocks();
		}
	}, [] );

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
