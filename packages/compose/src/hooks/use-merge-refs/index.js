/**
 * WordPress dependencies
 */
import { useRef, useCallback, useLayoutEffect } from '@wordpress/element';

/* eslint-disable jsdoc/valid-types */
/**
 * @template T
 * @typedef {T extends import('react').Ref<infer R> ? R : never} TypeFromRef
 */
/* eslint-enable jsdoc/valid-types */

/**
 * @template T
 * @param {import('react').Ref<T>} ref
 * @param {T}                      value
 */
function assignRef( ref, value ) {
	if ( typeof ref === 'function' ) {
		ref( value );
	} else if ( ref && ref.hasOwnProperty( 'current' ) ) {
		/* eslint-disable jsdoc/no-undefined-types */
		/** @type {import('react').MutableRefObject<T>} */ ( ref ).current =
			value;
		/* eslint-enable jsdoc/no-undefined-types */
	}
}

/**
 * Merges refs into one ref callback.
 *
 * It also ensures that the merged ref callbacks are only called when they
 * change (as a result of a `useCallback` dependency update) OR when the ref
 * value changes, just as React does when passing a single ref callback to the
 * component.
 *
 * As expected, if you pass a new function on every render, the ref callback
 * will be called after every render.
 *
 * If you don't wish a ref callback to be called after every render, wrap it
 * with `useCallback( callback, dependencies )`. When a dependency changes, the
 * old ref callback will be called with `null` and the new ref callback will be
 * called with the same value.
 *
 * To make ref callbacks easier to use, you can also pass the result of
 * `useRefEffect`, which makes cleanup easier by allowing you to return a
 * cleanup function instead of handling `null`.
 *
 * It's also possible to _disable_ a ref (and its behaviour) by simply not
 * passing the ref.
 *
 * ```jsx
 * const ref = useRefEffect( ( node ) => {
 *   node.addEventListener( ... );
 *   return () => {
 *     node.removeEventListener( ... );
 *   };
 * }, [ ...dependencies ] );
 * const otherRef = useRef();
 * const mergedRefs useMergeRefs( [
 *   enabled && ref,
 *   otherRef,
 * ] );
 * return <div ref={ mergedRefs } />;
 * ```
 *
 * @template {import('react').Ref<any>} TRef
 * @param {Array<TRef>} refs The refs to be merged.
 *
 * @return {import('react').RefCallback<TypeFromRef<TRef>>} The merged ref callback.
 */
export default function useMergeRefs( refs ) {
	const element = useRef();
	const isAttachedRef = useRef( false );
	const didElementChangeRef = useRef( false );
	/* eslint-disable jsdoc/no-undefined-types */
	/** @type {import('react').MutableRefObject<TRef[]>} */
	/* eslint-enable jsdoc/no-undefined-types */
	const previousRefsRef = useRef( [] );
	const currentRefsRef = useRef( refs );

	// Update on render before the ref callback is called, so the ref callback
	// always has access to the current refs.
	currentRefsRef.current = refs;

	// If any of the refs change, call the previous ref with `null` and the new
	// ref with the node, except when the element changes in the same cycle, in
	// which case the ref callbacks will already have been called.
	useLayoutEffect( () => {
		if (
			didElementChangeRef.current === false &&
			isAttachedRef.current === true
		) {
			refs.forEach( ( ref, index ) => {
				const previousRef = previousRefsRef.current[ index ];
				if ( ref !== previousRef ) {
					assignRef( previousRef, null );
					assignRef( ref, element.current );
				}
			} );
		}

		previousRefsRef.current = refs;
	}, refs );

	// No dependencies, must be reset after every render so ref callbacks are
	// correctly called after a ref change.
	useLayoutEffect( () => {
		didElementChangeRef.current = false;
	} );

	// There should be no dependencies so that `callback` is only called when
	// the node changes.
	return useCallback( ( value ) => {
		// Update the element so it can be used when calling ref callbacks on a
		// dependency change.
		assignRef( element, value );

		didElementChangeRef.current = true;
		isAttachedRef.current = value !== null;

		// When an element changes, the current ref callback should be called
		// with the new element and the previous one with `null`.
		const refsToAssign = value
			? currentRefsRef.current
			: previousRefsRef.current;

		// Update the latest refs.
		for ( const ref of refsToAssign ) {
			assignRef( ref, value );
		}
	}, [] );
}
