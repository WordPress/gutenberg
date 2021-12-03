/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';

export default function useMobileWarning( newImages ) {
	const { createWarningNotice } = useDispatch( noticesStore );
	const { toggleFeature } = useDispatch( interfaceStore );
	const isMobileWarningActive = useSelect( ( select ) => {
		const { isFeatureActive } = select( interfaceStore );
		return isFeatureActive( 'core/edit-post', 'mobileGalleryWarning' );
	}, [] );

	if ( ! isMobileWarningActive || ! newImages ) {
		return;
	}

	createWarningNotice(
		__(
			'If you want to edit the gallery you just added in the mobile app, to avoid losing any data please make sure you use version 18.2 of the app or above.'
		),
		{ type: 'snackbar', explicitDismiss: true }
	);
	toggleFeature( 'core/edit-post', 'mobileGalleryWarning' );
}
