/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { createBlock } from '@wordpress/blocks';
import { useEffect } from '@wordpress/element';
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

function useInserterBlockItems( {
	rootClientId,
	selectBlockOnInsert,
	onInsert,
} ) {
	const { items, fetchReusableBlocks } = useSelect(
		( select ) => {
			const { getInserterItems, getSettings } = select(
				'core/block-editor'
			);
			const { __experimentalFetchReusableBlocks } = getSettings();

			return {
				items: getInserterItems( rootClientId ),
				fetchReusableBlocks: __experimentalFetchReusableBlocks,
			};
		},
		[ rootClientId ]
	);

	// Fetch resuable when showing blocks on the inserter
	useEffect( () => {
		if ( fetchReusableBlocks ) {
			fetchReusableBlocks();
		}
	}, [] );

	const onSelectItem = ( item ) => {
		const { name, title, initialAttributes, innerBlocks } = item;
		const insertedBlock = createBlock(
			name,
			initialAttributes,
			createBlocksFromInnerBlocksTemplate( innerBlocks )
		);

		onInsert( insertedBlock );

		if ( ! selectBlockOnInsert ) {
			// translators: %s: the name of the block that has been added
			const message = sprintf( __( '%s block added' ), title );
			speak( message );
		}
	};

	return [ items, onSelectItem ];
}

export default useInserterBlockItems;
