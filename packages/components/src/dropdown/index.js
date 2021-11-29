// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';

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

export default function Dropdown( {
	renderContent,
	renderToggle,
	position = 'bottom right',
	className,
	contentClassName,
	expandOnMobile,
	headerTitle,
	focusOnMount,
	popoverProps,
	onClose,
	onToggle,
} ) {
	const containerRef = useRef();
	const [ isOpen, setIsOpen ] = useObservableState( false, onToggle );

	useEffect(
		() => () => {
			if ( onToggle ) {
				onToggle( false );
			}
		},
		[]
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

	return (
		<div
			className={ classnames( 'components-dropdown', className ) }
			ref={ containerRef }
			// Some UAs focus the closest focusable parent when the toggle is
			// clicked. Making this div focusable ensures such UAs will focus
			// it and `closeIfFocusOutside` can tell if the toggle was clicked.
			tabIndex="-1"
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
