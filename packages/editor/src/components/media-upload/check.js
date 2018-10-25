/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function MediaUploadCheck( { hasUploadPermissions, fallback, children } ) {
	const optionalFallback = fallback || null;
	return hasUploadPermissions ? children : optionalFallback;
}

export default withSelect( ( select ) => {
	return {
		hasUploadPermissions: select( 'core' ).hasUploadPermissions(),
	};
} )( MediaUploadCheck );
