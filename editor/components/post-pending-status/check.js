/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isCurrentPostPublished } from '../../selectors';

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

export default compose(
	applyConnect,
	applyWithAPIData
)( PostPendingStatusCheck );
