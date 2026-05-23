/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * Hook that provides section block editing state and actions.
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Object containing section block state and actions.
 */
export default function useContentOnlySectionEdit( clientId ) {
	const {
		isSectionBlock,
		parentSectionBlock,
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
			} = unlock( select( blockEditorStore ) );

			const editedSection = getEditedContentOnlySection();
			const isSection = _isSectionBlock( clientId );
			const parentSection = getParentSectionBlock( clientId );

			return {
				isSectionBlock: isSection,
				parentSectionBlock: parentSection,
				isWithinSection: isSection || !! parentSection,
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
		unlock( blockEditorActions );

	return {
		isSectionBlock,
		parentSectionBlock,
		isWithinSection,
		isWithinEditedSection,
		isEditingContentOnlySection,
		editedContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	};
}
