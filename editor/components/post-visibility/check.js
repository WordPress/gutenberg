/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

export function PostVisibilityCheck( { user, render } ) {
	const canEdit = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	return render( { canEdit } );
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postType: select( 'core/editor' ).getCurrentPostType(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType } = props;

		return {
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} ),
] )( PostVisibilityCheck );
