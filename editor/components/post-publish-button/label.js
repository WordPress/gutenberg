/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isCurrentPostPublished,
	isEditedPostBeingScheduled,
	isSavingPost,
	isPublishingPost,
	getCurrentPostType,
} from '../../store/selectors';

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

const applyConnect = connect(
	( state ) => ( {
		isPublished: isCurrentPostPublished( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
		isSaving: isSavingPost( state ),
		isPublishing: isPublishingPost( state ),
		postType: getCurrentPostType( state ),
	} )
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PublishButtonLabel );
