import { useSelect } from '@wordpress/data';
import {
	cloneBlock,
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { searchBlockItems } from '../components/inserter/search-items';
import useBlockTypesState from '../components/inserter/hooks/use-block-types-state';
import BlockIcon from '../components/block-icon';
import { store as blockEditorStore } from '../store';
import { orderBy } from '../utils/sorting';
import { orderInserterBlockItems } from '../utils/order-inserter-block-items';

const noop = () => {};
const SHOWN_BLOCK_TYPES = 9;

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {Object} A blocks completer.
 */
function createBlockCompleter() {
	return {
		name: 'blocks',
		className: 'block-editor-autocompleters__block',
		triggerPrefix: '/',

		useItems( filterValue ) {
			const { rootClientId, selectedBlockId, prioritizedBlocks } =
				useSelect( ( select ) => {
					const {
						getSelectedBlockClientId,
						getBlock,
						getBlockListSettings,
						getBlockRootClientId,
					} = select( blockEditorStore );
					const { getActiveBlockVariation } = select( blocksStore );
					const selectedBlockClientId = getSelectedBlockClientId();
					const { name: blockName, attributes } = getBlock(
						selectedBlockClientId
					);
					const activeBlockVariation = getActiveBlockVariation(
						blockName,
						attributes
					);
					const _rootClientId = getBlockRootClientId(
						selectedBlockClientId
					);
					return {
						selectedBlockId: activeBlockVariation
							? `${ blockName }/${ activeBlockVariation.name }`
							: blockName,
						rootClientId: _rootClientId,
						prioritizedBlocks:
							getBlockListSettings( _rootClientId )
								?.prioritizedInserterBlocks,
					};
				}, [] );
			const [ items, categories, collections ] = useBlockTypesState(
				rootClientId,
				noop,
				true
			);

			const filteredItems = useMemo( () => {
				const initialFilteredItems = !! filterValue.trim()
					? searchBlockItems(
							items,
							categories,
							collections,
							filterValue
					  )
					: orderInserterBlockItems(
							orderBy( items, 'frecency', 'desc' ),
							prioritizedBlocks
					  );

				return initialFilteredItems
					.filter( ( item ) => item.id !== selectedBlockId )
					.slice( 0, SHOWN_BLOCK_TYPES );
			}, [
				filterValue,
				selectedBlockId,
				items,
				categories,
				collections,
				prioritizedBlocks,
			] );

			const options = useMemo(
				() =>
					filteredItems.map( ( blockItem ) => {
						const { title, icon, isDisabled } = blockItem;
						return {
							key: `block-${ blockItem.id }`,
							value: blockItem,
							label: (
								<>
									<BlockIcon
										key="icon"
										icon={ icon }
										showColors
									/>
									{ title }
								</>
							),
							isDisabled,
						};
					} ),
				[ filteredItems ]
			);

			return [ options ];
		},
		allowContext( before, after ) {
			return ! ( /\S/.test( before ) || /\S/.test( after ) );
		},
		getOptionCompletion( inserterItem ) {
			const {
				name,
				initialAttributes,
				innerBlocks,
				innerContent,
				syncStatus,
				blocks,
			} = inserterItem;

			const unsyncedFallbackBlock = createBlock(
				name,
				initialAttributes
			);

			const unsyncedBlocks = ( blocks ?? [] ).map( ( block ) =>
				cloneBlock( block )
			);

			let value;
			if ( syncStatus === 'unsynced' ) {
				if ( name === 'core/block' && initialAttributes?.ref ) {
					value = unsyncedFallbackBlock;
				} else if ( unsyncedBlocks.length ) {
					value = unsyncedBlocks;
				} else {
					value = unsyncedFallbackBlock;
				}
			} else {
				value = createBlock(
					name,
					initialAttributes,
					createBlocksFromInnerBlocksTemplate( innerBlocks ),
					innerContent
				);
			}

			return {
				action: 'replace',
				value,
			};
		},
	};
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {Object} A blocks completer.
 */
export default createBlockCompleter();
