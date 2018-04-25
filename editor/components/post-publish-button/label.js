/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
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
	user,
} ) {
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );
	const isContributor = user.data && ! userCanPublishPosts;

	if ( isPublishing ) {
		return __( 'Publishing…' );
	} else if ( isPublished && isSaving ) {
		return __( 'Updating…' );
	} else if ( isBeingScheduled && isSaving ) {
		return __( 'Scheduling…' );
	}

	if ( isContributor ) {
		return __( 'Submit for Review' );
	} else if ( isPublished ) {
		return __( 'Update' );
	} else if ( isBeingScheduled ) {
		return __( 'Schedule' );
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
			getCurrentPostType,
		} = select( 'core/editor' );
		return {
			isPublished: isCurrentPostPublished(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			isSaving: forceIsSaving || isSavingPost(),
			isPublishing: isPublishingPost(),
			postType: getCurrentPostType(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType } = props;

		return {
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} ),
] )( PublishButtonLabel );
