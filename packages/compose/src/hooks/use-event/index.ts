/**
 * WordPress dependencies
 */
import { useRef, useInsertionEffect, useCallback } from '@wordpress/element';

/**
 * Any function.
 */
export type AnyFunction = ( ...args: any ) => any;

/**
 * Creates a stable callback function that has access to the latest state and
 * can be used within event handlers and effect callbacks. Throws when used in
 * the render phase.
 *
 * @param callback The callback function to wrap.
 *
 * @example
 *
 * ```tsx
 * function Component(props) {
 *   const onClick = useEvent(props.onClick);
 *   React.useEffect(() => {}, [onClick]);
 * }
 * ```
 */
export default function useEvent< T extends AnyFunction >(
	/**
	 * The callback function to wrap.
	 */
	callback?: T
) {
	const ref = useRef< AnyFunction | undefined >( () => {
		throw new Error(
			'Callbacks created with `useEvent` cannot be called during rendering.'
		);
	} );
	useInsertionEffect( () => {
		ref.current = callback;
	} );
	return useCallback< AnyFunction >(
		( ...args ) => ref.current?.( ...args ),
		[]
	) as T;
}
