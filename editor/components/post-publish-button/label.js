/**
 * External dependencies
 */
import { connect } from 'react-redux';

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
} from '../../store/selectors';

export function PublishButtonLabel( {
	isPublished,
	isBeingScheduled,
	isSaving,
	isPublishing,
	user,
} ) {
	const isContributor = user.data && ! user.data.capabilities.publish_posts;

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
	} )
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PublishButtonLabel );
