/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';

export default function useEntityRecordDelete( kind, type, id ) {
	const { deleteEntityRecord } = useDispatch( coreStore );
	const { getLastEntityDeleteError } = useSelect( coreStore );

	return useMemo(
		() => ( {
			deleteRecord: async () => {
				const result = await deleteEntityRecord( kind, type, id );
				const error = getLastEntityDeleteError( kind, type, id );
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
