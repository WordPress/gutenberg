/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function PublishButtonLabel( {
	isPublished,
	isBeingScheduled,
	isSaving,
	isPublishing,
	hasPublishAction,
	isAutosaving,
	hasNonPostEntityChanges,
} ) {
	if ( isPublishing ) {
		/* translators: button label text should, if possible, be under 16 characters. */
		return __( 'Publishing…' );
	} else if ( isPublished && isSaving && ! isAutosaving ) {
		/* translators: button label text should, if possible, be under 16 characters. */
		return __( 'Updating…' );
	} else if ( isBeingScheduled && isSaving && ! isAutosaving ) {
		/* translators: button label text should, if possible, be under 16 characters. */
		return __( 'Scheduling…' );
	}

	if ( ! hasPublishAction ) {
		return hasNonPostEntityChanges
			? __( 'Submit for Review…' )
			: __( 'Submit for Review' );
	} else if ( isPublished ) {
		return hasNonPostEntityChanges ? __( 'Update…' ) : __( 'Update' );
	} else if ( isBeingScheduled ) {
		return hasNonPostEntityChanges ? __( 'Schedule…' ) : __( 'Schedule' );
	}

	return __( 'Publish' );
}

export default compose( [
	withSelect( ( select, { forceIsSaving } ) => {
		const {
			isCurrentPostPublished,
			isEditedPostBeingScheduled,
			isSavingPost,
			isPublishingPost,
			getCurrentPost,
			getCurrentPostType,
			isAutosavingPost,
		} = select( editorStore );
		return {
			isPublished: isCurrentPostPublished(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isSaving: forceIsSaving || isSavingPost(),
			isPublishing: isPublishingPost(),
			hasPublishAction: get(
				getCurrentPost(),
				[ '_links', 'wp:action-publish' ],
				false
			),
			postType: getCurrentPostType(),
			isAutosaving: isAutosavingPost(),
		};
	} ),
] )( PublishButtonLabel );
