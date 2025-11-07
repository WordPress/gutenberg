/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useContentOnlySectionEdit from '../use-content-only-section-edit';

export function UnlockDesignMenuItem( { clientId, onClose } ) {
	const {
		isSectionBlock,
		isEditingContentOnlySection,
		editContentOnlySection,
	} = useContentOnlySectionEdit( clientId );

	// Only show when the experiment is enabled, the block is a section block,
	// and we're not already editing it
	if (
		! window?.__experimentalContentOnlyPatternInsertion ||
		! isSectionBlock ||
		isEditingContentOnlySection
	) {
		return null;
	}

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
