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
 * Multiple props can be passed in using in `object`.
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
 * @template T
 * @param {T} prop
 * @return {{current: T|undefined}} The prop reference.
 */
export function usePropRef( prop ) {
	const propRef = useRef( prop );

	useEffect( () => {
		propRef.current = prop;
	}, [ prop ] );

	return propRef;
}

export default usePropRef;
