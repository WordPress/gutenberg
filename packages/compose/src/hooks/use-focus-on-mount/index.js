/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean|string} focusOnMount Focus on mount mode.
 * @return {Function|Object} Element Ref.
 *
 * @example
 * ```js
 * import { useFocusOnMount } from '@wordpress/compose';
 *
 * const WithFocusOnMount = () => {
 *     const ref = useFocusOnMount()
 *     return (
 *         <div ref={ ref }>
 *             <Button />
 *             <Button />
 *         </div>
 *     );
 * }
 * ```
 */
function useFocusOnMount( focusOnMount = 'firstElement' ) {
	const focusOnMountRef = useRef( focusOnMount );
	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	// Ideally we should be using a function ref (useCallback)
	// Right now we have some issues where the link popover remounts
	// prevents us from doing that.
	// The downside of the current implementation is that it doesn't update if the "ref" changes.
	const ref = useRef();

	// Focus handling
	useEffect( () => {
		/*
		 * Without the setTimeout, the dom node is not being focused. Related:
		 * https://stackoverflow.com/questions/35522220/react-ref-with-focus-doesnt-work-without-settimeout-my-example
		 *
		 * TODO: Treat the cause, not the symptom.
		 */
		const focusTimeout = setTimeout( () => {
			if ( ! focusOnMountRef.current || ! ref.current ) {
				return;
			}

			if ( focusOnMountRef.current === 'firstElement' ) {
				const firstTabbable = focus.tabbable.find( ref.current )[ 0 ];

				if ( firstTabbable ) {
					firstTabbable.focus();
				} else {
					ref.current.focus();
				}

				return;
			}

			if ( focusOnMountRef.current === 'container' ) {
				ref.current.focus();
			}
		}, 0 );

		return () => clearTimeout( focusTimeout );
	}, [] );

	return ref;
}

export default useFocusOnMount;
