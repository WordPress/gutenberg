/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * A `React.useEffect` that will not run on the first render.
 * Source:
 * https://github.com/ariakit/ariakit/blob/main/packages/ariakit-react-core/src/utils/hooks.ts
 *
 * @param {import('react').EffectCallback} effect
 * @param {import('react').DependencyList} deps
 */
function useUpdateEffect( effect, deps ) {
	const mountedRef = useRef( false );
	useEffect( () => {
		if ( mountedRef.current ) {
			return effect();
		}
		mountedRef.current = true;
		return undefined;
		// 1. This hook needs to pass a dep list that isn't an array literal
		// 2. `effect` is missing from the array, and will need to be added carefully to avoid additional warnings
		// see https://github.com/WordPress/gutenberg/pull/41166
	}, deps );

	useEffect(
		() => () => {
			mountedRef.current = false;
		},
		[]
	);
}

export default useUpdateEffect;
