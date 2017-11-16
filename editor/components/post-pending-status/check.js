/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isCurrentPostPublished } from '../../state/selectors';

export function PostPendingStatusCheck( { isPublished, children, user } ) {
	if ( isPublished || ! user.data || ! user.data.capabilities.publish_posts ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => ( {
		isPublished: isCurrentPostPublished( state ),
	} ),
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight(
	applyConnect,
	applyWithAPIData
)( PostPendingStatusCheck );
