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
import type { InserterItem } from '../store/types';

const noop = () => {};
const SHOWN_BLOCK_TYPES = 9;

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return A blocks completer.
 */
function createBlockCompleter() {
	return {
		name: 'blocks',
		className: 'block-editor-autocompleters__block',
		triggerPrefix: '/',

		useItems( filterValue: string ) {
			const { rootClientId, selectedBlockId, prioritizedBlocks } =
				useSelect( ( select ) => {
					const {
						getSelectedBlockClientId,
						getBlock,
						getBlockListSettings,
						getBlockRootClientId,
					} = select( blockEditorStore );
					const { getActiveBlockVariation } = select( blocksStore );
					// The completer runs in the selected block.
					const selectedBlockClientId =
						getSelectedBlockClientId() as string;
					const { name: blockName, attributes } = getBlock(
						selectedBlockClientId
					)!;
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
		allowContext( before: string, after: string ) {
			return ! ( /\S/.test( before ) || /\S/.test( after ) );
		},
		getOptionCompletion( inserterItem: InserterItem ) {
			const {
				name,
				initialAttributes,
				innerBlocks,
				innerContent,
				syncStatus,
				blocks,
			} = inserterItem;

			return {
				action: 'replace',
				value:
					syncStatus === 'unsynced'
						? ( blocks ?? [] ).map( ( block ) =>
								cloneBlock( block )
							)
						: createBlock(
								name,
								initialAttributes,
								createBlocksFromInnerBlocksTemplate(
									// Variations hold inner block templates.
									innerBlocks as Parameters<
										typeof createBlocksFromInnerBlocksTemplate
									>[ 0 ]
								),
								innerContent
							),
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
