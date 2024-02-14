/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * @typedef {Object} NetworkInformation
 *
 * @property {boolean} [isConnected] Whether the device is connected to a network.
 */

/**
 * Returns the current network connectivity status provided by `window.navigator`.
 *
 * @example
 *
 * ```jsx
 * const { isConnected } = useNetworkConnectivity();
 * ```
 *
 * @return {NetworkInformation} Network information.
 */
export default function useNetworkConnectivity() {
	const [ isConnected, setIsConnected ] = useState( window.navigator.onLine );

	const setOnline = () => {
		setIsConnected( true );
	};

	const setOffline = () => {
		setIsConnected( false );
	};

	useEffect( () => {
		window.addEventListener( 'online', setOnline );
		window.addEventListener( 'offline', setOffline );

		return () => {
			window.removeEventListener( 'online', setOnline );
			window.removeEventListener( 'offline', setOffline );
		};
	}, [] );

	return { isConnected };
}
