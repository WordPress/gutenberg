/**
 * Internal dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '../';

export default function useEntityMutation( kind, type, id ) {
	const mutationState = useSelect(
		( select ) => ( {
			editedRecord: select( coreStore ).getEditedEntityRecord(
				kind,
				type,
				id
			),
			hasEdits: select( coreStore ).hasEditsForEntityRecord(
				kind,
				type,
				id
			),
			isSaving: select( coreStore ).isSavingEntityRecord(
				kind,
				type,
				id
			),
			saveError: select( coreStore ).getLastEntitySaveError(
				kind,
				type,
				id
			),
			isDeleting: select( coreStore ).isDeletingEntityRecord(
				kind,
				type,
				id
			),
			deleteError: select( coreStore ).getLastEntityDeleteError(
				kind,
				type,
				id
			),
		} ),
		[ id ]
	);

	const {
		editEntityRecord,
		saveEditedEntityRecord,
		deleteEntityRecord,
	} = useDispatch( coreStore );

	const mutationFunctions = useMemo(
		() => ( {
			edit: ( record ) => editEntityRecord( kind, type, id, record ),
			save: ( record ) =>
				saveEditedEntityRecord( kind, type, id, record ),
			saveEdited: () => saveEditedEntityRecord( kind, type, id ),
			delete: () => deleteEntityRecord( kind, type, id ),
		} ),
		[ id ]
	);

	return {
		...mutationFunctions,
		...mutationState,
	};
}
