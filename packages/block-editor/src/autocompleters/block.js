/**
 * External dependencies
 */
import { noop, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { searchBlockItems } from '../components/inserter/search-items';
import useBlockTypesState from '../components/inserter/hooks/use-block-types-state';
import { includeVariationsInInserterItems } from '../components/inserter/utils';
import BlockIcon from '../components/block-icon';

const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
	return map(
		innerBlocksTemplate,
		( [ name, attributes, innerBlocks = [] ] ) =>
			createBlock(
				name,
				attributes,
				createBlocksFromInnerBlocksTemplate( innerBlocks )
			)
	);
};

/** @typedef {import('@wordpress/block-editor').WPEditorInserterItem} WPEditorInserterItem */

/** @typedef {import('@wordpress/components').WPCompleter} WPCompleter */

/**
 * Creates a blocks repeater for replacing the current block with a selected block type.
 *
 * @param {Object} props                                   Component props.
 * @param {string} [props.getBlockInsertionParentClientId] Client ID of the parent.
 * @param {string} [props.getInserterItems]                Inserter items for parent.
 * @param {string} [props.getSelectedBlockName]            Name of selected block or null.
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
					} = select( 'core/block-editor' );
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
				return searchBlockItems(
					items,
					categories,
					collections,
					filterValue
				).filter( ( item ) => item.name !== selectedBlockName );
			}, [
				filterValue,
				selectedBlockName,
				items,
				categories,
				collections,
			] );

			const options = useMemo(
				() =>
					includeVariationsInInserterItems( filteredItems ).map(
						( blockItem ) => {
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
						}
					),
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
