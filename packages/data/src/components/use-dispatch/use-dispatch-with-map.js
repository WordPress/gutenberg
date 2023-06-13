/**
 * WordPress dependencies
 */
import { useMemo, useRef } from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';

/**
 * Custom react hook for returning aggregate dispatch actions using the provided
 * dispatchMap.
 *
 * Currently this is an internal api only and is implemented by `withDispatch`
 *
 * @param {Function} dispatchMap Receives the `registry.dispatch` function as
 *                               the first argument and the `registry` object
 *                               as the second argument.  Should return an
 *                               object mapping props to functions.
 * @param {Array}    deps        An array of dependencies for the hook.
 * @return {Object}  An object mapping props to functions created by the passed
 *                   in dispatchMap.
 */
const useDispatchWithMap = ( dispatchMap, deps ) => {
	const registry = useRegistry();
	const currentDispatchMap = useRef( dispatchMap );

	useIsomorphicLayoutEffect( () => {
		currentDispatchMap.current = dispatchMap;
	} );

	return useMemo( () => {
		const currentDispatchProps = currentDispatchMap.current(
			registry.dispatch,
			registry
		);
		return Object.fromEntries(
			Object.entries( currentDispatchProps ).map(
				( [ propName, dispatcher ] ) => {
					if ( typeof dispatcher !== 'function' ) {
						// eslint-disable-next-line no-console
						console.warn(
							`Property ${ propName } returned from dispatchMap in useDispatchWithMap must be a function.`
						);
					}
					return [
						propName,
						( ...args ) =>
							currentDispatchMap
								.current( registry.dispatch, registry )
								[ propName ]( ...args ),
					];
				}
			)
		);
	}, [ registry, ...deps ] );
};

export default useDispatchWithMap;
