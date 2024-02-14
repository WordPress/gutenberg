/**
 * WordPress dependencies
 */
import { useNetworkConnectivity, useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const OfflineStatus = () => {
	const { isConnected } = useNetworkConnectivity();
	const isLargeViewport = useViewportMatch( 'small' );

	if ( isConnected ) {
		return null;
	}

	const label = isLargeViewport ? __( 'Working offline' ) : null;

	return (
		<Button
			className="offline-status"
			variant="tertiary"
			size="compact"
			icon="airplane"
			label={ label }
			aria-disabled
		>
			{ label }
		</Button>
	);
};

export default OfflineStatus;
