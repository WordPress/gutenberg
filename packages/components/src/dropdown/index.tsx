import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
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
	const containerRef = useRef< HTMLDivElement >( null );
	const lastActivationWasInsideRef = useRef( false );

	const [ isOpen, setIsOpen ] = useControlledValue( {
		defaultValue: defaultOpen,
		value: open,
		onChange: onToggle,
	} );

	useEffect( () => {
		if ( ! isOpen || ! containerRef.current ) {
			return;
		}

		const { ownerDocument } = containerRef.current;
		const activationEvents = [ 'pointerdown', 'keydown', 'click' ] as const;
		const resetActivationOrigin = () => {
			lastActivationWasInsideRef.current = false;
		};

		// Native document capture runs before the React capture handlers below.
		// Events from portaled Popover content still follow the React tree, so
		// those handlers can mark an activation as internal again.
		for ( const eventName of activationEvents ) {
			ownerDocument.addEventListener(
				eventName,
				resetActivationOrigin,
				true
			);
		}

		return () => {
			for ( const eventName of activationEvents ) {
				ownerDocument.removeEventListener(
					eventName,
					resetActivationOrigin,
					true
				);
			}
		};
	}, [ isOpen ] );

	function recordActivationInside() {
		lastActivationWasInsideRef.current = true;
	}

	function recordKeyboardActivationInside(
		event: React.KeyboardEvent< HTMLDivElement >
	) {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			recordActivationInside();
		}
	}

	/**
	 * Closes the popover when focus leaves it unless the toggle was pressed or
	 * focus has moved to a dialog opened from the dropdown. The former lets the
	 * toggle handle closing the popover. The latter preserves presence so focus
	 * can return when the dialog is dismissed.
	 */
	function closeIfFocusOutside() {
		if ( ! containerRef.current ) {
			return;
		}

		const { ownerDocument } = containerRef.current;
		const activeElement = ownerDocument?.activeElement;
		const dialog = activeElement?.closest( '[role="dialog"]' );
		const isParentDialog = dialog?.contains( containerRef.current );
		if (
			! containerRef.current.contains( activeElement ) &&
			( ! dialog ||
				isParentDialog ||
				! lastActivationWasInsideRef.current )
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
			onClickCapture={ recordActivationInside }
			onPointerDownCapture={ recordActivationInside }
			onKeyDownCapture={ recordKeyboardActivationInside }
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
