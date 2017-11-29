/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	isCurrentPostPublished,
	isEditedPostBeingScheduled,
	isSavingPost,
	isPublishingPost,
} from '../../selectors';

export function PublishButtonLabel( {
	isPublished,
	isBeingScheduled,
	isPublishing,
	user,
} ) {
	const isContributor = user.data && ! user.data.capabilities.publish_posts;

	if ( isPublishing ) {
		return __( 'Publishing…' );
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
		// Need a selector
		isPublishing: isPublishingPost( state ),
	} )
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
] )( PublishButtonLabel );
