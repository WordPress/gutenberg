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
		stopEditingContentOnlySection( clientId );
	}, [ clientId, stopEditingContentOnlySection ] );

	if ( ! isContentLocked && ! isEditingContentOnlySection ) {
		return null;
	}

	const showDoneButton = isEditingContentOnlySection && ! isContentLocked;

	return (
		showDoneButton && (
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
