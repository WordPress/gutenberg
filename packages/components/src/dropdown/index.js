// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Popover from '../popover';

function useObservableState( initialState, onStateChange ) {
	const [ state, setState ] = useState( initialState );
	return [
		state,
		( value ) => {
			setState( value );
			if ( onStateChange ) {
				onStateChange( value );
			}
		},
	];
}

export default function Dropdown( props ) {
	const {
		renderContent,
		renderToggle,
		className,
		contentClassName,
		expandOnMobile,
		headerTitle,
		focusOnMount,
		position,
		popoverProps,
		onClose,
		onToggle,
		style,
	} = props;
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ fallbackPopoverAnchor, setFallbackPopoverAnchor ] =
		useState( null );
	const containerRef = useRef();
	const [ isOpen, setIsOpen ] = useObservableState( false, onToggle );

	useEffect(
		() => () => {
			if ( onToggle && isOpen ) {
				onToggle( false );
			}
		},
		[ onToggle, isOpen ]
	);

	function toggle() {
		setIsOpen( ! isOpen );
	}

	/**
	 * Closes the popover when focus leaves it unless the toggle was pressed or
	 * focus has moved to a separate dialog. The former is to let the toggle
	 * handle closing the popover and the latter is to preserve presence in
	 * case a dialog has opened, allowing focus to return when it's dismissed.
	 */
	function closeIfFocusOutside() {
		const { ownerDocument } = containerRef.current;
		const dialog = ownerDocument.activeElement.closest( '[role="dialog"]' );
		if (
			! containerRef.current.contains( ownerDocument.activeElement ) &&
			( ! dialog || dialog.contains( containerRef.current ) )
		) {
			close();
		}
	}

	function close() {
		if ( onClose ) {
			onClose();
		}
		setIsOpen( false );
	}

	const args = { isOpen, onToggle: toggle, onClose: close };
	const popoverPropsHaveAnchor =
		!! popoverProps?.anchor ||
		// Note: `anchorRef`, `getAnchorRect` and `anchorRect` are deprecated and
		// be removed from `Popover` from WordPress 6.3
		!! popoverProps?.anchorRef ||
		!! popoverProps?.getAnchorRect ||
		!! popoverProps?.anchorRect;

	return (
		<div
			className={ classnames( 'components-dropdown', className ) }
			ref={ useMergeRefs( [ setFallbackPopoverAnchor, containerRef ] ) }
			// Some UAs focus the closest focusable parent when the toggle is
			// clicked. Making this div focusable ensures such UAs will focus
			// it and `closeIfFocusOutside` can tell if the toggle was clicked.
			tabIndex="-1"
			style={ style }
		>
			{ renderToggle( args ) }
			{ isOpen && (
				<Popover
					position={ position }
					onClose={ close }
					onFocusOutside={ closeIfFocusOutside }
					expandOnMobile={ expandOnMobile }
					headerTitle={ headerTitle }
					focusOnMount={ focusOnMount }
					// This value is used to ensure that the dropdowns
					// align with the editor header by default.
					offset={ 13 }
					anchor={
						! popoverPropsHaveAnchor
							? fallbackPopoverAnchor
							: undefined
					}
					{ ...popoverProps }
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
