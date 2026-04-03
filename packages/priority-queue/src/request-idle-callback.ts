/**
 * External dependencies
 */
import 'requestidlecallback';

/**
 * Internal dependencies
 */
import type { RequestIdleCallbackCallback } from './types';

/**
 * @return A function that schedules a callback when the browser is idle or via setTimeout on the server.
 */
export function createRequestIdleCallback() {
	if ( typeof window === 'undefined' ) {
		return ( callback: RequestIdleCallbackCallback ) => {
			setTimeout( () => callback( Date.now() ), 0 );
		};
	}

	return window.requestIdleCallback;
}

export default createRequestIdleCallback();
