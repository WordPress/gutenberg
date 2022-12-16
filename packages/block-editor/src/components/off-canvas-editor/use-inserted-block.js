/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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
		updateBlockAttributes( insertedBlockClientId, _updatedAttributes );
	};

	return {
		insertedBlockAttributes,
		insertedBlockName,
		setInsertedBlockAttributes,
	};
};
