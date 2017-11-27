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
} from '../../selectors';

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
	} else if ( isSaving ) {
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
		// Need a selector
		isPublishing: false,
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
