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

const NON_BLOCK_CATEGORIES = [ 'reusable' ];

const ALLOWED_EMBED_VARIATIONS = [ 'core/embed' ];

function BlockTypesTab( { onSelect, rootClientId, listProps } ) {
	const clipboardBlock = useClipboardBlock( rootClientId );

	const { items } = useSelect(
		( select ) => {
			const { getInserterItems } = select( blockEditorStore );

			const allItems = getInserterItems( rootClientId );
			const blockItems = allItems.filter(
				( { id, category } ) =>
					! NON_BLOCK_CATEGORIES.includes( category ) &&
					// We don't want to show all possible embed variations
					// as different blocks in the inserter. We'll only show a
					// few popular ones.
					( category !== 'embed' ||
						( category === 'embed' &&
							ALLOWED_EMBED_VARIATIONS.includes( id ) ) )
			);

			return {
				items: clipboardBlock
					? [ clipboardBlock, ...blockItems ]
					: blockItems,
			};
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

export default BlockTypesTab;
