/**
 * WordPress dependencies
 */
import { useSelect, useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { IDLE, READY, RESOLVING } from './constants';

export default function useEntityRecord( kind, type, id ) {
	const {
		data,
		isResolving,
		hasFinished: isResolved,
	} = useQuerySelect( ( resolve ) =>
		resolve( coreStore ).getEntityRecord( kind, type, id )
	);

	let status;
	if ( isResolving ) {
		status = RESOLVING;
	} else if ( isResolved || data ) {
		status = READY;
	} else {
		status = IDLE;
	}

	const { editedRecord, hasEdits } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasEditsForEntityRecord } = select(
				coreStore
			);

			const args = [ kind, type, id ];
			return {
				editedRecord: getEditedEntityRecord( ...args ),
				hasEdits: hasEditsForEntityRecord( ...args ),
			};
		},
		[ kind, type, id ]
	);

	return {
		status,
		record: data,
		editedRecord,
		hasEdits,
		isResolving,
		isResolved,
	};
}
