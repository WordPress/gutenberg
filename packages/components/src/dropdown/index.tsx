/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../context';
import { useControlledValue } from '../utils/hooks';
import Popover from '../popover';
import type { DropdownProps, DropdownInternalContext } from './types';

const UnconnectedDropdown = (
	props: DropdownProps,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		renderContent,
		renderToggle,
		className,
		contentClassName,
		expandOnMobile,
		headerTitle,
		focusOnMount,
		popoverProps,
		onClose,
		onToggle,
		style,

		open,
		defaultOpen,

		// Deprecated props
		position,

		// From context system
		variant,
	} = useContextSystem< DropdownProps & DropdownInternalContext >(
		props,
		'Dropdown'
	);

	if ( position !== undefined ) {
		deprecated( '`position` prop in wp.components.Dropdown', {
			since: '6.2',
			alternative: '`popoverProps.placement` prop',
			hint: 'Note that the `position` prop will override any values passed through the `popoverProps.placement` prop.',
		} );
	}

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ fallbackPopoverAnchor, setFallbackPopoverAnchor ] =
		useState< HTMLDivElement | null >( null );
	const containerRef = useRef< HTMLDivElement >();

	const [ isOpen, setIsOpen ] = useControlledValue( {
		defaultValue: defaultOpen,
		value: open,
		onChange: onToggle,
	} );

	/**
	 * Closes the popover when focus leaves it unless the toggle was pressed or
	 * focus has moved to a separate dialog. The former is to let the toggle
	 * handle closing the popover and the latter is to preserve presence in
	 * case a dialog has opened, allowing focus to return when it's dismissed.
	 */
	function closeIfFocusOutside() {
		if ( ! containerRef.current ) {
			return;
		}

		const { ownerDocument } = containerRef.current;
		const dialog =
			ownerDocument?.activeElement?.closest( '[role="dialog"]' );
		if (
			! containerRef.current.contains( ownerDocument.activeElement ) &&
			( ! dialog || dialog.contains( containerRef.current ) )
		) {
			close();
		}
	}

	function close() {
		onClose?.();
		setIsOpen( false );
	}

	const args = {
		isOpen: !! isOpen,
		onToggle: () => setIsOpen( ! isOpen ),
		onClose: close,
	};
	const popoverPropsHaveAnchor =
		!! popoverProps?.anchor ||
		// Note: `anchorRef`, `getAnchorRect` and `anchorRect` are deprecated and
		// be removed from `Popover` from WordPress 6.3
		!! popoverProps?.anchorRef ||
		!! popoverProps?.getAnchorRect ||
		!! popoverProps?.anchorRect;

	return (
		<div
			className={ className }
			ref={ useMergeRefs( [
				containerRef,
				forwardedRef,
				setFallbackPopoverAnchor,
			] ) }
			// Some UAs focus the closest focusable parent when the toggle is
			// clicked. Making this div focusable ensures such UAs will focus
			// it and `closeIfFocusOutside` can tell if the toggle was clicked.
			tabIndex={ -1 }
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
					variant={ variant }
					{ ...popoverProps }
					className={ clsx(
						'components-dropdown__content',
						popoverProps?.className,
						contentClassName
					) }
				>
					{ renderContent( args ) }
				</Popover>
			) }
		</div>
	);
};

/**
 * Renders a button that opens a floating content modal when clicked.
 *
 * ```jsx
 * import { Button, Dropdown } from '@wordpress/components';
 *
 * const MyDropdown = () => (
 *   <Dropdown
 *     className="my-container-class-name"
 *     contentClassName="my-dropdown-content-classname"
 *     popoverProps={ { placement: 'bottom-start' } }
 *     renderToggle={ ( { isOpen, onToggle } ) => (
 *       <Button
 *         variant="primary"
 *         onClick={ onToggle }
 *         aria-expanded={ isOpen }
 *       >
 *         Toggle Dropdown!
 *       </Button>
 *     ) }
 *     renderContent={ () => <div>This is the content of the dropdown.</div> }
 *   />
 * );
 * ```
 */
export const Dropdown = contextConnect( UnconnectedDropdown, 'Dropdown' );

export default Dropdown;
