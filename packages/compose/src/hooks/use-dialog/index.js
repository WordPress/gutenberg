/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useConstrainedTabbing from '../use-constrained-tabbing';
import useFocusOnMount from '../use-focus-on-mount';
import useFocusReturn from '../use-focus-return';
import useFocusOutside from '../use-focus-outside';
import useMergeRefs from '../use-merge-refs';
import useLatestRef from '../use-latest-ref';

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
	const onClose = useLatestRef( options.onClose );
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
	}, [] );

	return [
		useMergeRefs( [
			constrainedTabbingRef,
			focusReturnRef,
			focusOnMountRef,
			closeOnEscapeRef,
		] ),
		{
			...focusOutsideProps,
			tabIndex: '-1',
		},
	];
}

export default useDialog;
