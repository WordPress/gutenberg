/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Renders the label for the publish button.
 *
 * @return {string} The label for the publish button.
 */
export default function PublishButtonLabel() {
	const isSmallerThanMediumViewport = useViewportMatch( 'medium', '<' );
	const {
		isPublished,
		isBeingScheduled,
		isSaving,
		isPublishing,
		hasPublishAction,
		isAutosaving,
		hasNonPostEntityChanges,
		postStatusHasChanged,
		postStatus,
		isPostSavingLocked,
	} = useSelect( ( select ) => {
		const {
			isCurrentPostPublished,
			isEditedPostBeingScheduled,
			isSavingPost,
			isPublishingPost,
			getCurrentPost,
			isAutosavingPost,
			getPostEdits,
			getEditedPostAttribute,
		} = select( editorStore );
		return {
			isPublished: isCurrentPostPublished(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isSaving: isSavingPost(),
			isPublishing: isPublishingPost(),
			hasPublishAction:
				getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
			isAutosaving: isAutosavingPost(),
			hasNonPostEntityChanges:
				select( editorStore ).hasNonPostEntityChanges(),
			isPostSavingLocked: select( editorStore ).isPostSavingLocked(),
			postStatusHasChanged: !! getPostEdits()?.status,
			postStatus: getEditedPostAttribute( 'status' ),
		};
	}, [] );
	if ( isPublishing ) {
		/* translators: button label text should, if possible, be under 16 characters. */
		return __( 'Publishing…' );
	} else if (
		( isPublished || isBeingScheduled ) &&
		isSaving &&
		! isAutosaving
	) {
		/* translators: button label text should, if possible, be under 16 characters. */
		return __( 'Saving…' );
	}
	if ( ! hasPublishAction ) {
		// TODO: this is because "Submit for review" string is too long in some languages.
		// @see https://github.com/WordPress/gutenberg/issues/10475
		return isSmallerThanMediumViewport
			? __( 'Publish' )
			: __( 'Submit for Review' );
	}
	if (
		( hasNonPostEntityChanges && ! isPostSavingLocked ) ||
		isPublished ||
		( postStatusHasChanged &&
			! [ 'future', 'publish' ].includes( postStatus ) ) ||
		( ! postStatusHasChanged && postStatus === 'future' )
	) {
		return __( 'Save' );
	}
	if ( isBeingScheduled ) {
		return __( 'Schedule' );
	}
	return __( 'Publish' );
}
