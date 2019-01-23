/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function MediaUploadCheck( { hasUploadPermissions, fallback = null, children } ) {
	return hasUploadPermissions ? children : fallback;
}

export default withSelect( ( select ) => {
	const { canUser } = select( 'core' );

	return {
		hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
	};
} )( MediaUploadCheck );
