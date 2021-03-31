/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../popover';

function useObservableState( initialState, onStateChange ) {
	const [ state, setState ] = useState( initialState );
	return [
		state,
		( valueOrSetter ) => {
			let syncState;
			if ( typeof valueOrSetter === 'function' ) {
				setState( ( value ) => {
					syncState = valueOrSetter( value );
					return syncState;
				} );
			} else {
				syncState = valueOrSetter;
				setState( valueOrSetter );
			}
			if ( onStateChange ) {
				onStateChange( syncState );
			}
		},
	];
}

export default function Dropdown( {
	autoClose = true,
	className,
	contentClassName,
	expandOnMobile,
	focusOnMount,
	headerTitle,
	onClose,
	onToggle,
	openOnMount = false,
	popoverProps,
	position = 'bottom right',
	renderContent,
	renderToggle,
} ) {
	const containerRef = useRef();
	const toggleRef = useRef();
	const isTogglePressed = useRef();
	const [ isOpen, setIsOpen ] = useObservableState( openOnMount, onToggle );

	useEffect( () => {
		// If onToggle was provided on mount, calls it with false on unmount
		if ( onToggle ) {
			return () => onToggle( false );
		}
	}, [] );

	function toggle() {
		setIsOpen( ( value ) => ! value );
	}

	/**
	 * Handles focus outside of the Popover to determine whether to close it.
	 * No action is taken in case autoClose is false or if pressing the toggle
	 * was the cause of the focus loss. The latter avoids the toggle click
	 * event handler changing the state back to open immediately after this.
	 */
	function onFocusOutsidePopover() {
		if ( toggleRef.current ) {
			if ( ! autoClose || isTogglePressed.current ) {
				return;
			}
			close();
		}
		// The rest is only for back-compat and could be removed at some point.
		// Attempts determination that the active element is inside Dropdown.
		// Prone to failure in UAs that do not focus pressed button elements
		// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#clicking_and_focus
		const { ownerDocument } = containerRef.current;
		if ( ! containerRef.current.contains( ownerDocument.activeElement ) ) {
			close();
		}
	}

	function close() {
		// Allows the callback to return false to cancel closing
		const willClose = onClose?.() ?? true;
		if ( willClose ) {
			setIsOpen( false );
		}
	}

	const setToggleRef = useCallback( ( node ) => {
		if ( node ) {
			toggleRef.current = node;
			Object.keys( toggleHandlers ).forEach( ( event ) => {
				node.addEventListener( event, toggleHandlers[ event ] );
			} );
		}
	}, [] );

	const toggleHandlers = {
		click: toggle,
		pointerdown: () => ( isTogglePressed.current = true ),
		pointerup: () => ( isTogglePressed.current = false ),
	};

	const args = {
		isOpen,
		onToggle: toggle,
		onClose: close,
		ref: setToggleRef,
	};

	return (
		<div
			className={ classnames( 'components-dropdown', className ) }
			ref={ containerRef }
		>
			{ renderToggle( args ) }
			{ isOpen && (
				<Popover
					position={ position }
					onClose={ close }
					onFocusOutside={ onFocusOutsidePopover }
					expandOnMobile={ expandOnMobile }
					headerTitle={ headerTitle }
					focusOnMount={ focusOnMount }
					{ ...popoverProps }
					anchorRef={
						popoverProps?.anchorRef ?? containerRef.current
					}
					className={ classnames(
						'components-dropdown__content',
						popoverProps ? popoverProps.className : undefined,
						contentClassName
					) }
				>
					{ renderContent( args ) }
				</Popover>
			) }
		</div>
	);
}
