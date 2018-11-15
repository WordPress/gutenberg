/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function MediaUploadCheck( { hasUploadPermissions, fallback = null, children } ) {
	return hasUploadPermissions ? children : fallback;
}

export default withSelect( ( select ) => {
	const { hasUploadPermissions } = select( 'core' );

	return {
		hasUploadPermissions: hasUploadPermissions(),
	};
} )( MediaUploadCheck );
