/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { cloudUpload } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ActionsPanelFill } from '../../layout/actions-panel';
import SaveDraftPanel from './save-draft-panel';

function SaveDraftButton( { forceIsDirty, showIconLabels = false } ) {
	const [ isSavingPanelVisible, setIsSavingPanelVisible ] = useState( false );
	const isLargeViewport = useViewportMatch( 'small' );

	const {
		isDirty,
		isPending,
		isPublished,
		isSaveable,
		isScheduled,
		hasPublishAction,
		dirtyEntityRecords,
	} = useSelect(
		( select ) => {
			const {
				isCurrentPostPublished,
				isCurrentPostScheduled,
				isEditedPostDirty,
				isEditedPostSaveable,
				getCurrentPost,
				getEditedPostAttribute,
			} = select( editorStore );

			return {
				isDirty: forceIsDirty || isEditedPostDirty(),
				isPending: 'pending' === getEditedPostAttribute( 'status' ),
				isPublished: isCurrentPostPublished(),
				isSaveable: isEditedPostSaveable(),
				isScheduled: isCurrentPostScheduled(),
				hasPublishAction:
					getCurrentPost()?._links?.[ 'wp:action-publish' ] ?? false,
				dirtyEntityRecords: select(
					coreStore
				).__experimentalGetDirtyEntityRecords(),
			};
		},
		[ forceIsDirty ]
	);

	const { savePost } = useDispatch( editorStore );

	// Once the post has been submitted for review this button
	// is not needed for the contributor role.
	// Also this button is only needed for draft posts (not published or scheduled)
	// This Button is also only useful when there are dirty changes.
	const shouldShowSaveDraftButton =
		! isPublished &&
		! isScheduled &&
		isSaveable &&
		isDirty &&
		! ( isPending && ! hasPublishAction );

	if ( ! shouldShowSaveDraftButton ) {
		return null;
	}

	const onSave = () => {
		if ( dirtyEntityRecords.length > 1 ) {
			setIsSavingPanelVisible( true );
		} else {
			savePost();
		}
	};

	/* translators: button label text should, if possible, be under 16 characters. */
	const label = isPending ? __( 'Save as pending' ) : __( 'Save draft' );

	/* translators: button label text should, if possible, be under 16 characters. */
	const shortLabel = __( 'Save' );

	return (
		<>
			<Button
				className="editor-post-save-draft"
				label={ isLargeViewport ? undefined : label }
				onClick={ onSave }
				shortcut={ displayShortcut.primary( 's' ) }
				isTertiary={ isLargeViewport }
				icon={ isLargeViewport ? undefined : cloudUpload }
			>
				{ isLargeViewport ? label : showIconLabels && shortLabel }
			</Button>
			{ isSavingPanelVisible && (
				<ActionsPanelFill>
					<SaveDraftPanel
						onClose={ () => setIsSavingPanelVisible( false ) }
					/>
				</ActionsPanelFill>
			) }
		</>
	);
}

export default SaveDraftButton;
