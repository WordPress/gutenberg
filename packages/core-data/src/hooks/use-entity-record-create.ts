/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';

export default function useEntityRecordCreate( kind, type ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const { getLastEntitySaveError } = useSelect( coreStore );

	return useMemo(
		() => ( {
			create: async ( record ) => {
				const result = await saveEntityRecord( kind, type, record );
				const error = getLastEntitySaveError( kind, type );
				// Error may be null, but the result is only available if everything worked correctly.
				if ( ! result ) {
					throw error;
				}
				return result;
			},
		} ),
		[ kind, type ]
	);
}
