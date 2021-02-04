/**
 * External dependencies
 */
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

function useCallbackRef( callback, deps ) {
	return useCallback(
		memize( callback, {
			maxSize: 1,
		} ),
		deps
	);
}

export default useCallbackRef;
