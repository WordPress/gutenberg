/**
 * WordPress dependencies
 */
import { useQuerySelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { INACTIVE, IDLE, SUCCESS, ERROR, RESOLVING } from './constants';

export default function useEntityRecord(
	kind,
	type,
	id,
	options = { runIf: true }
) {
	const {
		data,
		isMissing,
		isResolving,
		hasResolved,
		editedRecord,
		hasEdits,
	} = useQuerySelect(
		( resolve ) => {
			if ( ! options.runIf ) {
				return {
					status: INACTIVE,
					isMissing: true,
					hasResolved: false,
					hasEdits: false,
				};
			}

			const {
				getEntityRecord,
				getEditedEntityRecord,
				hasEditsForEntityRecord,
			} = resolve( coreStore );
			const args = [ kind, type, id ];
			const record = getEntityRecord( ...args );
			return {
				...record,
				isMissing: record.hasResolved && ! record.data,
				editedRecord: getEditedEntityRecord( ...args ).data,
				hasEdits: hasEditsForEntityRecord( ...args ).data,
			};
		},
		[ options.runIf ]
	);

	let status;
	if ( isResolving ) {
		status = RESOLVING;
	} else if ( hasResolved ) {
		if ( data ) {
			status = SUCCESS;
		} else {
			status = ERROR;
		}
	} else {
		status = IDLE;
	}

	return {
		status,
		record: data,
		editedRecord,
		hasEdits,
		isMissing,
		isResolving,
		hasResolved,
	};
}
