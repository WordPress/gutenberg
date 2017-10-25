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
} from '../../selectors';

export function PublishButtonLabel( {
	isPublished,
	isBeingScheduled,
	user,
} ) {
	const isContributor = user.data && ! user.data.capabilities.publish_posts;

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
	} )
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/${ wpApiSettings.versionString }users/me?context=edit',
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
] )( PublishButtonLabel );
