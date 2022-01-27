/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { IDLE, ERROR, RESOLVING } from './constants';
import { store as coreStore } from '../';

export default function useEntityRecordBuilder( kind, type, id ) {
	const [ record, setRecord ] = useState( {} );
	const { saveEntityRecord } = useDispatch( coreStore );

	const mutations = useMemo(
		() => ( {
			edit: ( diff ) => setRecord( { ...record, ...diff } ),
			save: () => saveEntityRecord( kind, type, id, record ),
			reset: () => setRecord( {} ),
		} ),
		[ record ]
	);

	const state = useSelect(
		( select ) => {
			const args = [ kind, type ];
			const { getLastEntitySaveError, isSavingEntityRecord } = select(
				coreStore
			);
			const error = getLastEntitySaveError( ...args );
			const isSaving = isSavingEntityRecord( ...args );

			let status;
			if ( isSaving ) {
				status = RESOLVING;
			} else if ( error ) {
				status = ERROR;
			} else {
				status = IDLE;
			}
			return {
				status,
				error,
				isSaving,
			};
		},
		[ kind, type ]
	);

	return {
		...mutations,
		...state,
	};
}
