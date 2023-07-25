/**
 * External dependencies
 */
import 'requestidlecallback';

/**
 * @typedef {( timeOrDeadline: IdleDeadline | number ) => void} Callback
 */

/**
 * @return {(callback: Callback) => void} RequestIdleCallback
 */
export function createRequestIdleCallback() {
	if ( typeof window === 'undefined' ) {
		return ( callback ) => {
			setTimeout( () => callback( Date.now() ), 0 );
		};
	}

	return window.requestIdleCallback;
}

export default createRequestIdleCallback();
