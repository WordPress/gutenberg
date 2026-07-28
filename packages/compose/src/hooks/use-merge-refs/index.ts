/**
 * WordPress dependencies
 */
import { useRef, useCallback, useLayoutEffect } from '@wordpress/element';
import type { MutableRefObject, Ref, RefCallback } from 'react';

// Returns a cleanup function if the ref callback returned one (React 19 ref
// callback cleanup pattern), otherwise `undefined`. Object refs never have a
// cleanup and only set `.current`.
function assignRef< T >( ref: Ref< T >, value: T ): ( () => void ) | undefined {
	if ( typeof ref === 'function' ) {
		const returned = ref( value );
		return typeof returned === 'function' ? returned : undefined;
	} else if ( ref && ref.hasOwnProperty( 'current' ) ) {
		( ref as MutableRefObject< T > ).current = value;
	}
	return undefined;
}

// Tear down a ref at the given index: prefer the stored cleanup; otherwise
// fall back to calling the ref with `null`.
function detachRef< T >(
	ref: Ref< T >,
	index: number,
	cleanups: Array< ( () => void ) | undefined >
): void {
	const cleanup = cleanups[ index ];
	if ( cleanup ) {
		cleanups[ index ] = undefined;
		cleanup();
	} else {
		assignRef( ref, null );
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
 * Inner ref callbacks may return a cleanup function (React 19's ref callback
 * cleanup pattern). When a ref callback returns a function, that function is
 * invoked at teardown (node change, dependency change, or unmount) **instead
 * of** the callback being called with `null`. Callbacks that do not return a
 * cleanup continue to receive `null` on teardown as before.
 *
 * It's also possible to _disable_ a ref (and its behaviour) by simply not
 * passing the ref.
 *
 * ```jsx
 * const ref = useCallback( ( node ) => {
 *   node.addEventListener( ... );
 *   return () => {
 *     node.removeEventListener( ... );
 *   };
 * }, [ ...dependencies ] );
 * const otherRef = useRef();
 * const mergedRefs = useMergeRefs( [
 *   enabled && ref,
 *   otherRef,
 * ] );
 * return <div ref={ mergedRefs } />;
 * ```
 *
 * @param refs The refs to be merged.
 * @return The merged ref callback.
 */
export default function useMergeRefs< T >(
	refs: Ref< T >[]
): RefCallback< T > {
	const elementRef = useRef< T | null >( null );
	// The refs that are attached to the element: set when the element
	// attaches, and kept in sync when a changed ref is swapped on render.
	const attachedRefsRef = useRef< Ref< T >[] >( [] );
	const currentRefsRef = useRef( refs );
	// Position-indexed cleanups returned by inner ref callbacks. A slot is
	// `undefined` when the ref at that position did not return a cleanup (or
	// is an object ref / disabled).
	const cleanupsRef = useRef< Array< ( () => void ) | undefined > >( [] );

	// Update on render before the ref callback is called, so the ref callback
	// always has access to the current refs.
	currentRefsRef.current = refs;

	// If any of the refs change, call the attached ref with `null` and the
	// new ref with the node. Comparing against the refs that are attached to
	// the element, rather than the previous render's refs, also covers an
	// element that attaches outside a render of this component (a merged ref
	// passed to a child that mounts the element in its own commit): the
	// change is still detected on the next render. When the element attached
	// during this commit, the ref callback has already been called with the
	// current refs, which compare equal here.
	useLayoutEffect( () => {
		const element = elementRef.current;

		if ( element === null ) {
			return;
		}

		refs.forEach( ( ref, index ) => {
			const attachedRef = attachedRefsRef.current[ index ];
			if ( ref !== attachedRef ) {
				detachRef( attachedRef, index, cleanupsRef.current );
				cleanupsRef.current[ index ] = assignRef( ref, element );
			}
		} );

		attachedRefsRef.current = refs;
	}, refs );

	// There should be no dependencies so that `callback` is only called when
	// the node changes.
	return useCallback( ( value: T | null ) => {
		// Update the element so it can be used when calling ref callbacks on a
		// dependency change.
		elementRef.current = value;

		// When an element changes, the current ref callback should be called
		// with the new element and the attached one with `null`.
		if ( value === null ) {
			attachedRefsRef.current.forEach( ( ref, index ) => {
				detachRef( ref, index, cleanupsRef.current );
			} );
			attachedRefsRef.current = [];
		} else {
			attachedRefsRef.current = currentRefsRef.current;
			attachedRefsRef.current.forEach( ( ref, index ) => {
				cleanupsRef.current[ index ] = assignRef( ref, value );
			} );
		}
	}, [] );
}
