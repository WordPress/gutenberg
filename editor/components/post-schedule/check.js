/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

export function PostScheduleCheck( { hasPublishAction, children } ) {
	if ( ! hasPublishAction ) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		const { getCurrentPost, getCurrentPostType } = select( 'core/editor' );
		return {
			hasPublishAction: get( getCurrentPost(), [ '_links', 'wp:action-publish' ], false ),
			postType: getCurrentPostType(),
		};
	} ),
] )( PostScheduleCheck );
