/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useConstrainedTabbing from '../use-constrained-tabbing';
import useFocusOnMount from '../use-focus-on-mount';
import useFocusReturn from '../use-focus-return';
import useFocusOutside from '../use-focus-outside';
import useMergeRefs from '../use-merge-refs';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef DialogOptions
 * @property {Parameters<useFocusOnMount>[0]} focusOnMount Focus on mount arguments.
 * @property {() => void}                     onClose      Function to call when the dialog is closed.
 */
/* eslint-enable jsdoc/valid-types */

/**
 * Returns a ref and props to apply to a dialog wrapper to enable the following behaviors:
 *  - constrained tabbing.
 *  - focus on mount.
 *  - return focus on unmount.
 *  - focus outside.
 *
 * @param {DialogOptions} options Dialog Options.
 */
function useDialog( options ) {
	/**
	 * @type {import('react').MutableRefObject<DialogOptions | undefined>}
	 */
	const currentOptions = useRef();
	useEffect( () => {
		currentOptions.current = options;
	}, Object.values( options ) );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusOnMountRef = useFocusOnMount( options.focusOnMount );
	const focusReturnRef = useFocusReturn();
	const focusOutsideProps = useFocusOutside( ( event ) => {
		// This unstable prop  is here only to manage backward compatibility
		// for the Popover component otherwise, the onClose should be enough.
		// @ts-ignore unstable property
		if ( currentOptions.current?.__unstableOnClose ) {
			// @ts-ignore unstable property
			currentOptions.current.__unstableOnClose( 'focus-outside', event );
		} else if ( currentOptions.current?.onClose ) {
			currentOptions.current.onClose();
		}
	} );
	const closeOnEscapeRef = useCallback( ( node ) => {
		if ( ! node ) {
			return;
		}

		node.addEventListener( 'keydown', (
			/** @type {KeyboardEvent} */ event
		) => {
			// Close on escape.
			if (
				event.keyCode === ESCAPE &&
				! event.defaultPrevented &&
				currentOptions.current?.onClose
			) {
				event.preventDefault();
				currentOptions.current.onClose();
			}
		} );
	}, [] );

	return [
		useMergeRefs( [
			options.focusOnMount !== false ? constrainedTabbingRef : null,
			options.focusOnMount !== false ? focusReturnRef : null,
			options.focusOnMount !== false ? focusOnMountRef : null,
			closeOnEscapeRef,
		] ),
		{
			...focusOutsideProps,
			tabIndex: '-1',
		},
	];
}

export default useDialog;
