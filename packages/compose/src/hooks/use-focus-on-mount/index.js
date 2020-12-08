/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { useCallback } from '@wordpress/element';

/**
 * Hook used to focus the first tabbable element on mount.
 *
 * @param {boolean|string} focusOnMount Focus on mount mode.
 * @return {Function} Element Ref.
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
	// Focus handling
	const ref = useCallback( ( node ) => {
		if ( ! node ) {
			return;
		}
		/*
		 * Without the setTimeout, the dom node is not being focused. Related:
		 * https://stackoverflow.com/questions/35522220/react-ref-with-focus-doesnt-work-without-settimeout-my-example
		 *
		 * TODO: Treat the cause, not the symptom.
		 */
		setTimeout( () => {
			if ( focusOnMount === 'firstElement' ) {
				// Find first tabbable node within content and shift focus, falling
				// back to the popover panel itself.
				const firstTabbable = focus.tabbable.find( node )[ 0 ];
				if ( firstTabbable ) {
					firstTabbable.focus();
				} else {
					node.focus();
				}

				return;
			}

			if ( focusOnMount === 'container' ) {
				// Focus the popover panel itself so items in the popover are easily
				// accessed via keyboard navigation.
				node.focus();
			}
		}, 0 );
	}, [] );

	return ref;
}

export default useFocusOnMount;
