/**
 * External dependencies
 */
import type { RefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';

/**
 * Creates a reference for a prop. This is useful for preserving dependency
 * memoization for hooks like useCallback.
 *
 * @see https://codesandbox.io/s/uselatestref-mlj3i?file=/src/App.tsx
 *
 * @param  value The value to reference
 * @return The prop reference.
 */
export default function useLatestRef< T >( value: T ): RefObject< T > {
	const ref = useRef( value );

	useIsomorphicLayoutEffect( () => {
		ref.current = value;
	} );

	return ref;
}
