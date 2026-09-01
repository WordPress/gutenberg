import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { contextConnect, useContextSystem } from '../context';
import { useControlledValue } from '../utils/hooks';
import Popover from '../popover';
import type { DropdownProps, DropdownInternalContext } from './types';

type InternalActivation = {
	sequence: number;
	dialogsBefore: Map< Document, Element | null >;
};

const getActiveDialog = ( ownerDocument: Document ) =>
	ownerDocument.activeElement?.closest( '[role="dialog"]' ) ?? null;

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
	const dialogOpenedByActivationRef = useRef< Element | null >( null );
	const internalActivationRef = useRef< InternalActivation | null >( null );
	const activationSequenceRef = useRef( 0 );

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
		const startActivation = () => {
			activationSequenceRef.current += 1;
			if (
				dialogOpenedByActivationRef.current !==
				getActiveDialog( ownerDocument )
			) {
				dialogOpenedByActivationRef.current = null;
			}
		};

		// Native document capture clears stale provenance before the React
		// capture handlers below record an internal activation. Events from
		// portaled Popover content still follow the React tree.
		for ( const eventName of activationEvents ) {
			ownerDocument.addEventListener( eventName, startActivation, true );
		}

		return () => {
			activationSequenceRef.current += 1;
			for ( const eventName of activationEvents ) {
				ownerDocument.removeEventListener(
					eventName,
					startActivation,
					true
				);
			}
		};
	}, [ isOpen ] );

	function startInternalActivation(
		event: React.SyntheticEvent< HTMLDivElement >
	) {
		if ( ! containerRef.current ) {
			return;
		}

		const containerDocument = containerRef.current.ownerDocument;
		const eventDocument = ( event.target as Node | null )?.ownerDocument;
		const ownerDocuments = [ containerDocument ];
		if ( eventDocument && eventDocument !== containerDocument ) {
			ownerDocuments.push( eventDocument );
		}

		const sequence = ++activationSequenceRef.current;
		internalActivationRef.current = {
			sequence,
			dialogsBefore: new Map(
				ownerDocuments.map(
					( ownerDocument ) =>
						[
							ownerDocument,
							getActiveDialog( ownerDocument ),
						] as const
				)
			),
		};

		const activeDialogIsKnown = ownerDocuments.some(
			( ownerDocument ) =>
				getActiveDialog( ownerDocument ) ===
				dialogOpenedByActivationRef.current
		);
		if ( ! activeDialogIsKnown ) {
			dialogOpenedByActivationRef.current = null;
		}

		// A target can stop propagation, so do not rely on the React bubble
		// handler to finalize the activation. The second check supports dialogs
		// that move focus in a timer before Popover checks focus outside.
		containerDocument.defaultView?.setTimeout( () => {
			if ( ! finishInternalActivation() ) {
				containerDocument.defaultView?.setTimeout(
					finishInternalActivation,
					0
				);
			}
		}, 0 );
	}

	function startInternalKeyboardActivation(
		event: React.KeyboardEvent< HTMLDivElement >
	) {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			startInternalActivation( event );
		}
	}

	function finishInternalActivation() {
		const activation = internalActivationRef.current;
		if (
			! activation ||
			activation.sequence !== activationSequenceRef.current
		) {
			return false;
		}

		for ( const [
			ownerDocument,
			dialogBefore,
		] of activation.dialogsBefore ) {
			const activeDialog = getActiveDialog( ownerDocument );
			if ( activeDialog && activeDialog !== dialogBefore ) {
				dialogOpenedByActivationRef.current = activeDialog;
				return true;
			}
		}

		const knownDialogIsStillActive = [
			...activation.dialogsBefore.keys(),
		].some(
			( ownerDocument ) =>
				getActiveDialog( ownerDocument ) ===
				dialogOpenedByActivationRef.current
		);
		if ( ! knownDialogIsStillActive ) {
			dialogOpenedByActivationRef.current = null;
		}
		return knownDialogIsStillActive;
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
		const dialogOpenedByActivation = dialogOpenedByActivationRef.current;
		dialogOpenedByActivationRef.current = null;
		activationSequenceRef.current += 1;
		const relatedDialogIsActive =
			!! dialogOpenedByActivation &&
			getActiveDialog( dialogOpenedByActivation.ownerDocument ) ===
				dialogOpenedByActivation;
		if (
			! containerRef.current.contains( activeElement ) &&
			( isParentDialog || ! relatedDialogIsActive )
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
			onClickCapture={ startInternalActivation }
			onPointerDownCapture={ startInternalActivation }
			onKeyDownCapture={ startInternalKeyboardActivation }
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
