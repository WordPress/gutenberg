/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	requestConnectionStatus,
	subscribeConnectionStatus,
} from '@wordpress/react-native-bridge';

/**
 * @typedef {Object} NetworkInformation
 *
 * @property {boolean} [isConnected] Whether the device is connected to a network.
 */

/**
 * Returns the current network connectivity status provided by the native bridge.
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
	const [ isConnected, setIsConnected ] = useState( true );

	useEffect( () => {
		let isCurrent = true;

		requestConnectionStatus( ( isBridgeConnected ) => {
			if ( ! isCurrent ) {
				return;
			}

			setIsConnected( isBridgeConnected );
		} );

		return () => {
			isCurrent = false;
		};
	}, [] );

	useEffect( () => {
		const subscription = subscribeConnectionStatus(
			( { isConnected: isBridgeConnected } ) => {
				setIsConnected( isBridgeConnected );
			}
		);

		return () => {
			subscription.remove();
		};
	}, [] );

	return { isConnected };
}
