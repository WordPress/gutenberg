/**
 * External dependencies
 */
import { get, includes, some, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

function PostTypeSupportCheck( { postType, children, supportKeys, themeSupports } ) {
	supportKeys = castArray( supportKeys );
	const isSupported = some(
		supportKeys, ( key ) => get( postType, [ 'supports', key ], false )
	);

	if ( ! isSupported ) {
		return null;
	}

	// 'thumbnail' and 'post-thumbnails' are intentionally different.
	if ( includes( supportKeys, 'thumbnail' ) &&
		! get( themeSupports, 'post-thumbnails', false ) ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const { getPostType, getThemeSupports } = select( 'core' );
	return {
		themeSupports: getThemeSupports(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
	};
} )( PostTypeSupportCheck );
