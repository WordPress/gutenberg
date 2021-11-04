/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';

export default function useMobileWarning() {
	const { createWarningNotice } = useDispatch( noticesStore );
	const { toggleFeature } = useDispatch( interfaceStore );
	const isMobileWarningActive = useSelect( ( select ) => {
		const { isFeatureActive } = select( interfaceStore );
		return isFeatureActive( 'core/edit-post', 'mobileGalleryWarning' );
	}, [] );

	if ( ! isMobileWarningActive ) {
		return;
	}

	createWarningNotice(
		__(
			'To edit this Gallery block in the WP mobile app you need to be using version 18.2 or higher.'
		),
		{ type: 'snackbar', explicitDismiss: true }
	);
	toggleFeature( 'core/edit-post', 'mobileGalleryWarning' );
}
