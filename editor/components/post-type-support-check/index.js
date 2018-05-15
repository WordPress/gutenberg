/**
 * External dependencies
 */
import { get, some, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

function PostTypeSupportCheck( { postType, children, supportKeys, defaultValue } ) {
	defaultValue = defaultValue || false;

	const isSupported = some(
		castArray( supportKeys ), ( key ) => get( postType, [ 'supports', key ], defaultValue )
	);

	if ( ! isSupported ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const { getPostType } = select( 'core' );
	return {
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
	};
} )( PostTypeSupportCheck );
