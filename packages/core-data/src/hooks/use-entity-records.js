/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { INACTIVE, IDLE, SUCCESS, ERROR, RESOLVING } from './constants';
import { store as coreStore } from '../';

export default function useEntityRecords(
	kind,
	type,
	query,
	options = { runIf: true }
) {
	return useQuerySelect(
		( resolve ) => {
			if ( ! options.runIf ) {
				return {
					records: null,
					status: INACTIVE,
					hasResolved: false,
					hasRecords: false,
				};
			}
			const { data, ...state } = resolve( coreStore ).getEntityRecords(
				kind,
				type,
				query
			);

			let status;
			if ( state.isResolving ) {
				status = RESOLVING;
			} else if ( state.hasResolved ) {
				if ( Array.isArray( data ) ) {
					status = SUCCESS;
				} else {
					status = ERROR;
				}
			} else {
				status = IDLE;
			}

			return {
				...state,
				records: data,
				status,
				hasRecords: status === SUCCESS && data?.length,
			};
		},
		[ query, options.runIf ]
	);
}
