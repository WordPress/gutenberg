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
	isScheduled,
	isBeingScheduled,
	isSaving,
	isPublishing,
	isScheduling,
	hasPublishAction,
	isAutosaving,
	hasNonPostEntityChanges,
} ) {
	if ( isPublishing ) {
		return __( 'Publishing…' );
	} else if ( isScheduling ) {
		return __( 'Scheduling…' );
	} else if ( ( isPublished || isScheduled ) && isSaving && ! isAutosaving ) {
		return __( 'Updating…' );
	}

	if ( isPublished || isScheduled ) {
		return hasNonPostEntityChanges ? __( 'Update…' ) : __( 'Update' );
	} else if ( isBeingScheduled ) {
		return hasNonPostEntityChanges ? __( 'Schedule…' ) : __( 'Schedule' );
	} else if ( ! hasPublishAction ) {
		return hasNonPostEntityChanges
			? __( 'Submit for Review…' )
			: __( 'Submit for Review' );
	}

	return __( 'Publish' );
}

export default compose( [
	withSelect( ( select, { forceIsSaving } ) => {
		const {
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostBeingScheduled,
			isSavingPost,
			isPublishingPost,
			isSchedulingPost,
			getCurrentPost,
			getCurrentPostType,
			isAutosavingPost,
		} = select( 'core/editor' );
		return {
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isSaving: forceIsSaving || isSavingPost(),
			isPublishing: isPublishingPost(),
			isScheduling: isSchedulingPost(),
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
