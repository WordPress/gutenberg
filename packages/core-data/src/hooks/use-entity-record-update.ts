/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';

export default function useEntityRecordUpdate( kind, type, id ) {
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch(
		coreStore
	);
	const { getLastEntitySaveError } = useSelect( coreStore );
	return useMemo(
		() => ( {
			applyEdits: ( record ) =>
				editEntityRecord( kind, type, id, record ),
			saveEdits: async () => {
				const result = await saveEditedEntityRecord( kind, type, id );
				const error = getLastEntitySaveError( kind, type, id );
				// Error may be null, but the result is only available if everything worked correctly.
				if ( ! result ) {
					throw error;
				}
				return result;
			},
		} ),
		[ kind, type, id ]
	);
}
