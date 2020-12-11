/**
 * External dependencies
 */
import mergeRefs from 'react-merge-refs';

/**
 * WordPress dependencies
 */
import { useRef, useCallback, useEffect } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useConstrainedTabbing from '../use-constrained-tabbing';
import useFocusOnMount from '../use-focus-on-mount';
import useFocusReturn from '../use-focus-return';
import useFocusOutside from '../use-focus-outside';

/**
 * Returns a ref and props to apply to a dialog wrapper to enable the following behaviors:
 *  - constrained tabbing.
 *  - focus on mount.
 *  - return focus on unmount.
 *  - focus outside.
 *
 * @param {Object} options Dialog Options.
 */
function useDialog( options ) {
	const onClose = useRef();
	useEffect( () => {
		onClose.current = options.onClose;
	}, [ options.onClose ] );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusOnMountRef = useFocusOnMount();
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( options.onClose );
	const closeOnEscapeRef = useCallback( ( node ) => {
		if ( ! node ) {
			return;
		}

		node.addEventListener( 'keydown', ( event ) => {
			// Close on escape
			if ( event.keyCode === ESCAPE && onClose.current ) {
				event.stopPropagation();
				onClose.current();
			}
		} );

		node.addEventListener( 'mousedown', ( event ) => {
			// I'm not really certain what this is for but it matches the previous behavior.
			event.stopPropagation();
		} );
	}, [] );

	return [
		mergeRefs( [
			constrainedTabbingRef,
			focusOnMountRef,
			focusReturnRef,
			closeOnEscapeRef,
		] ),
		focusOutsideProps,
	];
}

export default useDialog;
