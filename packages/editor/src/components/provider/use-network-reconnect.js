/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * A hook that pauses the media upload queue when the browser goes offline
 * and resumes it when connectivity is restored.
 *
 * Only active when client-side media processing is enabled.
 */
export default function useNetworkReconnect() {
	const isEnabled = window.__clientSideMediaProcessing;
	const registry = useRegistry();

	useEffect( () => {
		if ( ! isEnabled ) {
			return;
		}

		const handleOffline = () => {
			unlock( registry.dispatch( uploadStore ) ).pauseQueue();
		};

		const handleOnline = () => {
			unlock( registry.dispatch( uploadStore ) ).resumeQueue();
		};

		window.addEventListener( 'offline', handleOffline );
		window.addEventListener( 'online', handleOnline );

		return () => {
			window.removeEventListener( 'offline', handleOffline );
			window.removeEventListener( 'online', handleOnline );
		};
	}, [ isEnabled, registry ] );
}
