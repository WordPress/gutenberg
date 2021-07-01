/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Creates a reference for a prop. This is useful for preserving dependency
 * memoization for hooks like useCallback.
 *
 * @example
 * ```js
 * // Referencing a simple prop, used in a useCallback function.
 * const valueRef = usePropRef(value)
 *
 * const increment = useCallback(() => {
 *   const value = valueRef.current
 *   onChange(value + 1)
 * }, [onChange, valueRef])
 * ```
 *
 * ---
 *
 * Multiple props can be passed in using an `object`.
 *
 * @example
 * ```js
 * const propRefs = usePropRef({ value, step })
 *
 * const increment = useCallback(() => {
 *   const { value, step } = propRefs.current
 *   onChange(value + step)
 * }, [onChange, propRefs])
 * ```
 *
 * @param  prop
 * @return The prop reference.
 */
export function usePropRef< T >( prop: T ): MutableRefObject< T > {
	const propRef = useRef( prop );

	useEffect( () => {
		propRef.current = prop;
	}, [ prop ] );

	return propRef;
}
