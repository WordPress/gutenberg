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
		hasUploadPermissions: canUser( 'create', 'media', undefined, true ),
	};
} )( MediaUploadCheck );
