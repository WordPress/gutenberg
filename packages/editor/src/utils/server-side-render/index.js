/**
 * WordPress dependencies.
 */
import { ServerSideRender } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

export default withSelect( ( select ) => {
	const { getCurrentPostId } = select( 'core/editor' );

	return {
		urlQueryArgs: {
			post_id: getCurrentPostId(),
		},
	};
} )( ServerSideRender );
