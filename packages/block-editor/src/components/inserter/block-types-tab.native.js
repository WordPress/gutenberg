/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import useClipboardBlock from './hooks/use-clipboard-block';
import { store as blockEditorStore } from '../../store';
import useBlockTypeImpressions from './hooks/use-block-type-impressions';

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

function BlockTypesTab( { onSelect, rootClientId, listProps } ) {
	const clipboardBlock = useClipboardBlock( rootClientId );

	const { blockTypes } = useSelect(
		( select ) => {
			const { getInserterItems } = select( blockEditorStore );

			const allItems = getInserterItems( rootClientId );
			const blockItems = allItems.filter(
				( { category } ) => ! NON_BLOCK_CATEGORIES.includes( category )
			);

			return {
				blockTypes: clipboardBlock
					? [ clipboardBlock, ...blockItems ]
					: blockItems,
			};
		},
		[ rootClientId ]
	);

	const { items, trackBlockTypeSelected } = useBlockTypeImpressions(
		blockTypes
	);

	const handleSelect = ( ...args ) => {
		trackBlockTypeSelected( ...args );
		onSelect( ...args );
	};

	return (
		<BlockTypesList
			name="Blocks"
			items={ items }
			onSelect={ handleSelect }
			listProps={ listProps }
		/>
	);
}

export default BlockTypesTab;
