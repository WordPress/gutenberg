/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';

export default function useEntityRecords( kind, type, id, query ) {
	return useQuerySelect( ( resolve ) =>
		resolve( coreStore ).getEntityRecords( kind, type, id, query )
	);
}
