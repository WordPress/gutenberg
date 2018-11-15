/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function MediaUploadCheck( { hasUploadPermissions, fallback = null, children } ) {
	return hasUploadPermissions ? children : fallback;
}

export default withSelect( ( select ) => {
	let hasUploadPermissions = false;
	if ( undefined !== select( 'core' ) ) {
		hasUploadPermissions = select( 'core' ).hasUploadPermissions();
	}

	return {
		hasUploadPermissions: hasUploadPermissions,
	};
} )( MediaUploadCheck );
