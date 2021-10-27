/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

export default function MobileWarning() {
	const { toggleFeature } = useDispatch( interfaceStore );
	const isMobileWarningActive = useSelect( ( select ) => {
		const { isFeatureActive } = select( interfaceStore );
		return isFeatureActive( 'core/edit-post', 'mobileGalleryWarning' );
	}, [] );

	if ( ! isMobileWarningActive ) {
		return null;
	}

	return (
		<Notice
			status="warning"
			isDismissible={ true }
			onDismiss={ () =>
				toggleFeature( 'core/edit-post', 'mobileGalleryWarning' )
			}
		>
			{ __(
				'To edit this Gallery block in the WP mobile app you need to be using version 18.2 or higher.'
			) }
		</Notice>
	);
}
