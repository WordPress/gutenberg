/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

// Copied over from the Columns block. It seems like it should become part of public API.
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

	const onSelectItem = ( item ) => {
		const { name, initialAttributes, innerBlocks } = item;
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
