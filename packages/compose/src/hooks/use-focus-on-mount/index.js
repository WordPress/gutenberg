/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

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
	const [ node, setNode ] = useState();
	useEffect( () => {
		focusOnMountRef.current = focusOnMount;
	}, [ focusOnMount ] );

	// Ideally we should be running the focus behavior in the useCallback directly
	// Right now we have some issues where the link popover remounts
	// prevents us from doing that.
	const ref = useCallback( setNode, [] );

	// Focus handling
	useEffect( () => {
		if ( ! node ) {
			return;
		}
		/*
		 * Without the setTimeout, the dom node is not being focused. Related:
		 * https://stackoverflow.com/questions/35522220/react-ref-with-focus-doesnt-work-without-settimeout-my-example
		 *
		 * TODO: Treat the cause, not the symptom.
		 */
		const focusTimeout = setTimeout( () => {
			if ( focusOnMountRef.current === false || ! node ) {
				return;
			}

			if ( focusOnMountRef.current === 'firstElement' ) {
				const firstTabbable = focus.tabbable.find( node )[ 0 ];

				if ( firstTabbable ) {
					firstTabbable.focus();
				} else {
					node.focus();
				}

				return;
			}

			if (
				focusOnMountRef.current === 'container' ||
				focusOnMountRef.current === true
			) {
				node.focus();
			}
		}, 0 );

		return () => clearTimeout( focusTimeout );
	}, [ node ] );

	return ref;
}

export default useFocusOnMount;
