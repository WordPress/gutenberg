/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { rawHandler } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { getClipboard } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

function BlocksTab( { onSelect, rootClientId, listProps } ) {
	const { items } = useSelect(
		( select ) => {
			const { getInserterItems, canInsertBlockType } = select(
				'core/block-editor'
			);
			const { getBlockType } = select( 'core/blocks' );

			const clipboard = getClipboard();
			const clipboardBlock =
				clipboard && rawHandler( { HTML: clipboard } )[ 0 ];
			const shouldAddClipboardBlock =
				clipboardBlock &&
				canInsertBlockType( clipboardBlock.name, rootClientId );

			const allItems = getInserterItems( rootClientId );
			const blockItems = allItems.filter(
				( { category } ) => ! NON_BLOCK_CATEGORIES.includes( category )
			);

			// Add copied blocks in the clipboard as extra items
			const itemsWithClipboard = shouldAddClipboardBlock
				? [
						{
							...pick( getBlockType( clipboardBlock.name ), [
								'name',
								'icon',
							] ),
							id: 'clipboard',
							initialAttributes: clipboardBlock.attributes,
							innerBlocks: clipboardBlock.innerBlocks,
						},
						...blockItems,
				  ]
				: blockItems;

			return { items: itemsWithClipboard };
		},
		[ rootClientId ]
	);

	return (
		<BlockTypesList
			name="Blocks"
			items={ items }
			onSelect={ onSelect }
			listProps={ listProps }
		/>
	);
}

export default BlocksTab;
