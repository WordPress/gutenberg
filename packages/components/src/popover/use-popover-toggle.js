/**
 * WordPress dependencies
 */
import { useCallback, useState, useRef, useEffect } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

export default function usePopoverToggle( {
	toggleRef,
	focusOutsideDelay = 50,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const toggle = useCallback( () => setIsOpen( ( state ) => ! state ), [] );
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );

	const focusOutsideTimeoutRef = useRef( null );
	useEffect( () => () => clearTimeout( focusOutsideTimeoutRef.current ), [] );

	/**
	 * We are using onFocusOutside to ensure we aren't
	 * closing the popover here when clicking on the toggle button.
	 * Using onClose would result in closing and reopening the popover.
	 */
	const onFocusOutside = useCallback( () => {
		if ( ! toggleRef.current ) {
			close();
			return;
		}

		clearTimeout( focusOutsideTimeoutRef.current );
		/**
		 * Timeout is required to avoid bug in Firefox.
		 * Without timeout the focused element in Firefox is the
		 * popover content element. It takes a little bit of time
		 * for the focus to move that's why we need timeout.
		 */
		focusOutsideTimeoutRef.current = setTimeout( () => {
			const { ownerDocument } = toggleRef.current;
			if (
				! toggleRef.current.contains( ownerDocument.activeElement ) &&
				! ownerDocument.activeElement.closest( '[role="dialog"]' )
			) {
				close();
			}
		}, focusOutsideDelay );
	}, [ focusOutsideDelay, close ] );

	const onClose = useCallback(
		( event ) => {
			if ( event.keyCode === ESCAPE ) {
				event.stopPropagation();
				close();
			}
		},
		[ close ]
	);

	return { toggle, open, close, onFocusOutside, onClose, isOpen };
}
