/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/*
 * A `React.useEffect` that will not run on the first render.
 * Source:
 * https://github.com/reakit/reakit/blob/master/packages/reakit-utils/src/useUpdateEffect.ts
 */
export function useUpdateEffect( effect, deps ) {
	const mounted = useRef( false );

	useEffect( () => {
		if ( mounted.current ) {
			return effect();
		}
		mounted.current = true;
		return undefined;
	}, deps );
}
