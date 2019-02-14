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

export function PublishButtonLabel( {
	isPublished,
	isBeingScheduled,
	isSaving,
	isPublishing,
	hasPublishAction,
	isAutosaving,
	hasNonPostEntityChanges,
	visibility,
} ) {
	if ( isPublishing ) {
		return __( 'Publishing…' );
	} else if ( isPublished && isSaving && ! isAutosaving ) {
		return __( 'Updating…' );
	} else if ( isBeingScheduled && isSaving && ! isAutosaving ) {
		return __( 'Scheduling…' );
	}

	if ( ! hasPublishAction ) {
<<<<<<< HEAD
		return hasNonPostEntityChanges
			? __( 'Submit for Review…' )
			: __( 'Submit for Review' );
	} else if ( isPublished ) {
		return hasNonPostEntityChanges ? __( 'Update…' ) : __( 'Update' );
	} else if ( isBeingScheduled ) {
		return hasNonPostEntityChanges ? __( 'Schedule…' ) : __( 'Schedule' );
	}

	if ( 'private' === visibility ) {
		return __( 'Publish Privately' );
=======
		return __( 'Submit for Review' );
	} else if ( ! isPublished && 'private' === visibility ) {
		return __( 'Publish Privately' );
	} else if ( isBeingScheduled && 'private' !== visibility ) {
		return __( 'Schedule' );
	} else if ( isPublished ) {
		return __( 'Update' );
>>>>>>> Handle proper labeling for scheduled private posts
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
			getEditedPostVisibility,
		} = select( 'core/editor' );
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
			visibility: getEditedPostVisibility(),
		};
	} ),
] )( PublishButtonLabel );
