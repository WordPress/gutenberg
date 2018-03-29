/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

export function PublishButtonLabel( {
	isPublished,
	isBeingScheduled,
	isSaving,
	isPublishing,
	canPublishPosts,
} ) {
	if ( isPublishing ) {
		return __( 'Publishing…' );
	} else if ( isPublished && isSaving ) {
		return __( 'Updating…' );
	} else if ( isBeingScheduled && isSaving ) {
		return __( 'Scheduling…' );
	}

	if ( canPublishPosts === false ) {
		return __( 'Submit for Review' );
	} else if ( isPublished ) {
		return __( 'Update' );
	} else if ( isBeingScheduled ) {
		return __( 'Schedule' );
	}

	return __( 'Publish' );
}

export default withSelect(
	( select, { forceIsSaving } ) => {
		const {
			getEditedPostAttribute,
			isCurrentPostPublished,
			isEditedPostBeingScheduled,
			isSavingPost,
			isPublishingPost,
		} = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {
			isPublished: isCurrentPostPublished(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isSaving: forceIsSaving || isSavingPost(),
			isPublishing: isPublishingPost(),
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
)( PublishButtonLabel );
