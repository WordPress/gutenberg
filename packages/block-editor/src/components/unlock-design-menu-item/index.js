/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function UnlockDesignMenuItem( { clientId, onClose } ) {
	const { isSectionBlock, isEditingContentOnlySection } = useSelect(
		( select ) => {
			const {
				isSectionBlock: _isSectionBlock,
				getEditedContentOnlySection,
			} = unlock( select( blockEditorStore ) );
			return {
				isSectionBlock: _isSectionBlock( clientId ),
				isEditingContentOnlySection:
					getEditedContentOnlySection() === clientId,
			};
		},
		[ clientId ]
	);
	const blockEditorActions = useDispatch( blockEditorStore );

	// Only show when the experiment is enabled, the block is a section block,
	// and we're not already editing it
	if (
		! window?.__experimentalContentOnlyPatternInsertion ||
		! isSectionBlock ||
		isEditingContentOnlySection
	) {
		return null;
	}

	const { editContentOnlySection } = unlock( blockEditorActions );

	return (
		<MenuItem
			onClick={ () => {
				editContentOnlySection( clientId );
				onClose();
			} }
		>
			{ _x(
				'Unlock design',
				'Unlocking section block design in the Editor'
			) }
		</MenuItem>
	);
}
