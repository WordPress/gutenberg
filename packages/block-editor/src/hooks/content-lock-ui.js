/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls } from '../components';
import { unlock } from '../lock-unlock';

// The implementation of content locking is mainly in this file, although the mechanism
// to stop editing a content only section when an outside block is selected is in the component
// `StopEditingContentOnlySectionOnOutsideSelect` at block-editor/src/components/block-list/index.js.
// Besides the components on this file and the file referenced above the implementation
// also includes artifacts on the store (actions, reducers, and selector).

function ContentLockControlsPure( { clientId } ) {
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

	const { stopEditingContentOnlySection } = unlock(
		useDispatch( blockEditorStore )
	);
	const isContentLocked =
		! isLockedByParent && templateLock === 'contentOnly';

	const stopEditingAsBlockCallback = useCallback( () => {
		stopEditingContentOnlySection();
	}, [ stopEditingContentOnlySection ] );

	// Hide the Done button when the content only pattern insertion experiment is active.
	// This is replaced by an alternative UI in the experiment.
	if (
		window?.__experimentalContentOnlyPatternInsertion ||
		( ! isContentLocked && ! isEditingContentOnlySection )
	) {
		return null;
	}

	return (
		isEditingContentOnlySection && (
			<BlockControls group="other">
				<ToolbarButton onClick={ stopEditingAsBlockCallback }>
					{ __( 'Done' ) }
				</ToolbarButton>
			</BlockControls>
		)
	);
}

export default {
	edit: ContentLockControlsPure,
	hasSupport() {
		return true;
	},
};
