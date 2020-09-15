/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { rawHandler } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

function BlocksTab( { onSelect, rootClientId, listProps } ) {
	const { items } = useSelect(
		( select ) => {
			const {
				getInserterItems,
				getSettings,
				canInsertBlockType,
			} = select( 'core/block-editor' );
			const { getBlockType } = select( 'core/blocks' );
			const { getClipboard } = select( 'core/editor' );

			const clipboard = getClipboard();
			const clipboardBlock =
				clipboard && rawHandler( { HTML: clipboard } )[ 0 ];
			const shouldAddClipboardBlock =
				clipboardBlock &&
				canInsertBlockType( clipboardBlock.name, rootClientId );

			const allItems = getInserterItems( rootClientId );
			const items = allItems.filter(
				( { category } ) => ! NON_BLOCK_CATEGORIES.includes( category )
			);

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
						...items,
				  ]
				: items;

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
