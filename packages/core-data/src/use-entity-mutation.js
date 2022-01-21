/**
 * Internal dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '../';

export default function useEntityMutation( kind, type, id ) {
	const mutationState = useSelect(
		( select ) => {
			const args = [kind, type, id];
			return {
				editedRecord: select( coreStore ).getEditedEntityRecord( ...args ),
				hasEdits: select( coreStore ).hasEditsForEntityRecord( ...args ),
				isSaving: select( coreStore ).isSavingEntityRecord( ...args ),
				saveError: select( coreStore ).getLastEntitySaveError( ...args ),
				isDeleting: select( coreStore ).isDeletingEntityRecord( ...args ),
				deleteError: select( coreStore ).getLastEntityDeleteError( ...args ),
			};
		},
		[kind, type, id],
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
				saveEntityRecord( kind, type, id, record ),
			saveEdited: () => saveEditedEntityRecord( kind, type, id ),
			delete: () => deleteEntityRecord( kind, type, id ),
		} ),
		[id],
	);

	return {
		...mutationFunctions,
		...mutationState,
	};
}
