import { useEffect, useState } from '@wordpress/element';

/**
 * The given key, once it has stayed unchanged for `delay` milliseconds, and
 * null until then.
 *
 * Callers compare the result against the live key rather than reading a
 * boolean flag: a key that changes straight to another one would otherwise
 * still look settled for the render before the effect restarts the timer.
 *
 * @param key   Identifies what is being waited on, or null for nothing.
 * @param delay Milliseconds the key must stay unchanged.
 * @return The key once it has settled, otherwise null.
 */
export function useSettledKey(
	key: string | null,
	delay: number
): string | null {
	const [ settledKey, setSettledKey ] = useState< string | null >( null );
	useEffect( () => {
		setSettledKey( null );
		if ( ! key ) {
			return;
		}
		const timer = setTimeout( () => setSettledKey( key ), delay );
		return () => clearTimeout( timer );
	}, [ key, delay ] );
	return settledKey;
}
