/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

export const useInsertedBlock = ( insertedBlockClientId ) => {
	const { insertedBlockAttributes, insertedBlockName } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );

			return {
				insertedBlockAttributes: getBlockAttributes(
					insertedBlockClientId
				),
				insertedBlockName: getBlockName( insertedBlockClientId ),
			};
		},
		[ insertedBlockClientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const setInsertedBlockAttributes = ( _updatedAttributes ) => {
		if ( ! insertedBlockClientId ) return;
		updateBlockAttributes( insertedBlockClientId, _updatedAttributes );
	};

	if ( ! insertedBlockClientId ) {
		return {
			insertedBlockAttributes: undefined,
			insertedBlockName: undefined,
			setInsertedBlockAttributes,
		};
	}

	return {
		insertedBlockAttributes,
		insertedBlockName,
		setInsertedBlockAttributes,
	};
};
