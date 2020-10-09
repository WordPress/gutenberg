/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Retrieves the block types inserter state.
 *
 * @param {string=}  rootClientId        Insertion's root client ID.
 * @param {Function} onInsert            function called when inserter a list of blocks.
 * @return {Array} Returns the block types state. (block types, categories, collections, onSelect handler)
 */
const useBlockTypesState = ( rootClientId, onInsert ) => {
	const { categories, collections, items, fetchReusableBlocks } = useSelect(
		( select ) => {
			const { getInserterItems, getSettings } = select(
				'core/block-editor'
			);
			const { getCategories, getCollections } = select( 'core/blocks' );
			const { __experimentalFetchReusableBlocks } = getSettings();

			return {
				categories: getCategories(),
				collections: getCollections(),
				items: getInserterItems( rootClientId ),
				fetchReusableBlocks: __experimentalFetchReusableBlocks,
			};
		},
		[ rootClientId ]
	);

	// Fetch resuable blocks on mount
	useEffect( () => {
		if ( fetchReusableBlocks ) {
			fetchReusableBlocks();
		}
	}, [] );

	const onSelectItem = ( { name, initialAttributes, innerBlocks } ) => {
		const insertedBlock = createBlock(
			name,
			initialAttributes,
			createBlocksFromInnerBlocksTemplate( innerBlocks )
		);

		onInsert( insertedBlock );
	};

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
