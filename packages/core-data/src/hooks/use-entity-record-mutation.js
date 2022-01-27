/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '../';
import { IDLE, ERROR, RESOLVING } from './constants';

export default function useEntityRecordMutations( kind, type, id ) {
	const {
		editEntityRecord,
		saveEntityRecord,
		saveEditedEntityRecord,
		deleteEntityRecord,
	} = useDispatch( coreStore );

	const mutations = useMemo(
		() => ( {
			edit: ( record ) => editEntityRecord( kind, type, id, record ),
			create: ( record ) => saveEntityRecord( kind, type, id, record ),
			save: () => saveEditedEntityRecord( kind, type, id ),
			delete: () => deleteEntityRecord( kind, type, id ),
		} ),
		[ id ]
	);

	const state = useSelect(
		( select ) => {
			const args = [ kind, type, id ];
			const {
				getLastEntitySaveError,
				getLastEntityDeleteError,
				isSavingEntityRecord,
				isDeletingEntityRecord,
			} = select( coreStore );

			const saveError = getLastEntitySaveError( ...args );
			const deleteError = getLastEntityDeleteError( ...args );
			const error = saveError || deleteError;

			const isSaving = isSavingEntityRecord( ...args );
			const isDeleting = isDeletingEntityRecord( ...args );

			let status;
			if ( isSaving || isDeleting ) {
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
				isDeleting,
			};
		},
		[ kind, type, id ]
	);

	return {
		...mutations,
		...state,
	};
}
