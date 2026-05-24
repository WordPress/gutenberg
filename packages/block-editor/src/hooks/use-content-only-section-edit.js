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
	const { isSectionBlock, isEditingContentOnlySection } = useSelect(
		( select ) => {
			const {
				isSectionBlock: _isSectionBlock,
				getEditedContentOnlySection,
			} = unlock( select( blockEditorStore ) );

			const editedSection = getEditedContentOnlySection();
			const isSection = _isSectionBlock( clientId );

			return {
				isSectionBlock: isSection,
				isEditingContentOnlySection: editedSection === clientId,
			};
		},
		[ clientId ]
	);

	const blockEditorActions = useDispatch( blockEditorStore );
	const { editContentOnlySection, stopEditingContentOnlySection } =
		unlock( blockEditorActions );

	return {
		isSectionBlock,
		isEditingContentOnlySection,
		editContentOnlySection,
		stopEditingContentOnlySection,
	};
}
