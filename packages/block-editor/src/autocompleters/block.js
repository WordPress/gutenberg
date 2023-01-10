/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
} from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { searchBlockItems } from '../components/inserter/search-items';
import useBlockTypesState from '../components/inserter/hooks/use-block-types-state';
import BlockIcon from '../components/block-icon';
import { store as blockEditorStore } from '../store';
import { orderBy } from '../utils/sorting';

const noop = () => {};
const SHOWN_BLOCK_TYPES = 9;

/** @typedef {import('@wordpress/components').WPCompleter} WPCompleter */

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {WPCompleter} A blocks completer.
 */
function createBlockCompleter() {
	return {
		name: 'blocks',
		className: 'block-editor-autocompleters__block',
		triggerPrefix: '/',

		useItems( filterValue ) {
			const { rootClientId, selectedBlockName } = useSelect(
				( select ) => {
					const {
						getSelectedBlockClientId,
						getBlockName,
						getBlockInsertionPoint,
					} = select( blockEditorStore );
					const selectedBlockClientId = getSelectedBlockClientId();
					return {
						selectedBlockName: selectedBlockClientId
							? getBlockName( selectedBlockClientId )
							: null,
						rootClientId: getBlockInsertionPoint().rootClientId,
					};
				},
				[]
			);
			const [ items, categories, collections ] = useBlockTypesState(
				rootClientId,
				noop
			);

			const filteredItems = useMemo( () => {
				const initialFilteredItems = !! filterValue.trim()
					? searchBlockItems(
							items,
							categories,
							collections,
							filterValue
					  )
					: orderBy( items, 'frecency', 'desc' );

				return initialFilteredItems
					.filter( ( item ) => item.name !== selectedBlockName )
					.slice( 0, SHOWN_BLOCK_TYPES );
			}, [
				filterValue,
				selectedBlockName,
				items,
				categories,
				collections,
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
			const { name, initialAttributes, innerBlocks } = inserterItem;
			return {
				action: 'replace',
				value: createBlock(
					name,
					initialAttributes,
					createBlocksFromInnerBlocksTemplate( innerBlocks )
				),
			};
		},
	};
}

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @return {WPCompleter} A blocks completer.
 */
export default createBlockCompleter();
