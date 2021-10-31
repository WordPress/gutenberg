/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { createInterpolateElement } from '@wordpress/element';

export default function MobileWarning() {
	const { toggleFeature } = useDispatch( interfaceStore );
	const isMobileWarningActive = useSelect( ( select ) => {
		const { isFeatureActive } = select( interfaceStore );
		return isFeatureActive( 'core/edit-post', 'mobileGalleryWarning' );
	}, [] );

	if ( ! isMobileWarningActive ) {
		return null;
	}

	const mobileWarningText = createInterpolateElement(
		__(
			'To edit this Gallery block in the <a>WP mobile app</a> you need to be using version 18.2 or higher.'
		),
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		{ a: <a href="https://wordpress.org/mobile/" target="blank" /> }
	);
	return (
		<Notice
			status="info"
			isDismissible={ true }
			onDismiss={ () =>
				toggleFeature( 'core/edit-post', 'mobileGalleryWarning' )
			}
		>
			{ mobileWarningText }
		</Notice>
	);
}
