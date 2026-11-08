import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import type { BlockEditorThunkArgs } from '../store/types';
import type { ContentOnlySectionEdit } from './types';

/**
 * Hook that provides section block editing state and actions.
 *
 * @param clientId Block client ID.
 * @return Object containing section block state and actions.
 */
export default function useContentOnlySectionEdit(
	clientId: string
): ContentOnlySectionEdit {
	const {
		isSectionBlock,
		isWithinSection,
		isWithinEditedSection,
		isEditingContentOnlySection,
		editedContentOnlySection,
	} = useSelect(
		( select ) => {
			const {
				isSectionBlock: _isSectionBlock,
				getParentSectionBlock,
				getEditedContentOnlySection,
				isWithinEditedContentOnlySection,
			} = unlock< BlockEditorThunkArgs[ 'select' ] >(
				select( blockEditorStore )
			);

			const editedSection = getEditedContentOnlySection();

			return {
				isSectionBlock: _isSectionBlock( clientId ),
				isWithinSection:
					_isSectionBlock( clientId ) ||
					!! getParentSectionBlock( clientId ),
				isWithinEditedSection:
					isWithinEditedContentOnlySection( clientId ),
				isEditingContentOnlySection: editedSection === clientId,
				editedContentOnlySection: editedSection,
			};
		},
		[ clientId ]
	);

	const blockEditorActions = useDispatch( blockEditorStore );
	const { editContentOnlySection, stopEditingContentOnlySection } =
		unlock< BlockEditorThunkArgs[ 'dispatch' ] >( blockEditorActions );

	return {
		isSectionBlock,
		isWithinSection,
		isWithinEditedSection,
		isEditingContentOnlySection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	};
}
