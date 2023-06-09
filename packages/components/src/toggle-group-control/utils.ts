/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';

/**
 * A `React.useLayoutEffect` that will not run on the first render.
 * Based on the `useUpdateEffect` hook, but using `useLayoutEffect` instead of
 * `useEffect
 *
 * @param effect
 * @param deps
 */
export function useUpdateLayoutEffect(
	effect: React.EffectCallback,
	deps: React.DependencyList
) {
	const mounted = useRef( false );
	useLayoutEffect( () => {
		if ( mounted.current ) {
			return effect();
		}
		mounted.current = true;
		return undefined;
		// Disable reasons:
		// 1. This hook needs to pass a dep list that isn't an array literal
		// 2. `effect` is missing from the array, and will need to be added carefully to avoid additional warnings
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps );
}
