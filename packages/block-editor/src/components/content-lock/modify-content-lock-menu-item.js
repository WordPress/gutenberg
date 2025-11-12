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

// The implementation of content locking is mainly in this file, although the mechanism
// to stop editing a content only section when an outside block is selected is in the component
// `StopEditingContentOnlySectionOnOutsideSelect` at block-editor/src/components/block-list/index.js.
// Besides the components on this file and the file referenced above the implementation
// also includes artifacts on the store (actions, reducers, and selector).

export function ModifyContentOnlySectionMenuItem( { clientId, onClose } ) {
	const { templateLock, isLockedByParent, isEditingContentOnlySection } =
		useSelect(
			( select ) => {
				const {
					getContentLockingParent,
					getTemplateLock,
					getEditedContentOnlySection,
				} = unlock( select( blockEditorStore ) );
				return {
					templateLock: getTemplateLock( clientId ),
					isLockedByParent: !! getContentLockingParent( clientId ),
					isEditingContentOnlySection:
						getEditedContentOnlySection() === clientId,
				};
			},
			[ clientId ]
		);
	const blockEditorActions = useDispatch( blockEditorStore );
	const isContentLocked =
		! isLockedByParent && templateLock === 'contentOnly';

	// Hide the Modify button when the content only pattern insertion experiment is active.
	// This is replaced by an alternative UI in the experiment.
	if (
		window?.__experimentalContentOnlyPatternInsertion ||
		( ! isContentLocked && ! isEditingContentOnlySection )
	) {
		return null;
	}

	const { editContentOnlySection } = unlock( blockEditorActions );
	const showContentOnlyModifyButton =
		! isEditingContentOnlySection && isContentLocked;

	return (
		showContentOnlyModifyButton && (
			<MenuItem
				onClick={ () => {
					editContentOnlySection( clientId );
					onClose();
				} }
			>
				{ _x( 'Modify', 'Unlock content locked blocks' ) }
			</MenuItem>
		)
	);
}
