/**
 * External dependencies
 */
import clsx from 'clsx';
import type { FocusEvent, Ref, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import {
	createPortal,
	useEffect,
	useInsertionEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { useBaseControlProps } from '../base-control/hooks';
import Popover from '../popover';
import { Provider as SlotFillProvider } from '../slot-fill';

// Popovers opened from this control land either in the control's own portaled
// slot (see `SlotFillProvider` below) or, for popovers already migrated to
// `@wordpress/ui`, in the shared compat overlay slot.
const OWNED_POPOVER_SELECTOR =
	'[data-rich-text-control-popover-slot],[data-wp-compat-overlay-slot]';

type RichTextControlProps = {
	/**
	 * Label text for the control.
	 */
	label: string;
	/**
	 * Ref attached to the `contentEditable` element. The rich-text wiring is
	 * injected through this ref (e.g. the `useRichText` ref, event-listener
	 * refs, and an anchor ref), keeping this component free of any
	 * `@wordpress/rich-text` dependency.
	 */
	editableRef?: Ref< HTMLDivElement >;
	/**
	 * Called when the field gains or loses an "active" selection. The control
	 * is controlled: it owns no selection state itself, it only drives the
	 * focus/blur transitions (deferring deselection so a format popover opened
	 * from the field can claim focus without the field deselecting).
	 */
	onSelectedChange?: ( isSelected: boolean ) => void;
	/**
	 * Placeholder slot for the rich-text assembly (e.g. `FormatEdit` and its
	 * context providers). Rendered inside the control's private
	 * `SlotFillProvider` so any format popovers portal into this control's own
	 * `Popover.Slot`.
	 */
	children?: ReactNode;
	/**
	 * Unique identifier for the control.
	 */
	id?: string;
	/**
	 * Additional class name applied to the `contentEditable` element.
	 */
	className?: string;
	/**
	 * Whether to visually hide the label (still accessible to screen readers).
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Whether line breaks are disabled. Drives `aria-multiline`.
	 */
	disableLineBreaks?: boolean;
	/**
	 * Whether to move focus to the field when it mounts. Off by default; opt in
	 * for standalone forms where no other code lands focus on the field.
	 */
	focusOnMount?: boolean;
};

/**
 * A presentational rich text control: a labeled `contentEditable` form field
 * with the slot scaffolding format popovers need.
 *
 * Unlike the in-canvas `RichText` from `@wordpress/block-editor`, this control
 * is intended for standalone form fields (DataForms, sidebar inputs, etc.).
 * It is deliberately **presentational only** and has no `@wordpress/rich-text`
 * dependency: the editable behavior (value, formatting, keyboard shortcuts) is
 * injected by the consumer through `editableRef` and `children`. The consumer
 * owns the `useRichText` wiring; this component owns the chrome
 * (`BaseControl` + label, the editable element, and the popover slot).
 *
 * @example
 * ```jsx
 * // The rich-text "assembly" lives in the consumer.
 * <RichTextControl
 *     label="Caption"
 *     editableRef={ mergedRef }
 *     onSelectedChange={ setIsSelected }
 * >
 *     { isSelected && (
 *         <keyboardShortcutContext.Provider value={ shortcuts }>
 *             <FormatEdit … />
 *         </keyboardShortcutContext.Provider>
 *     ) }
 * </RichTextControl>
 * ```
 */
function RichTextControl( {
	label,
	editableRef,
	onSelectedChange,
	children,
	id,
	className,
	hideLabelFromVision,
	disableLineBreaks,
	focusOnMount,
}: RichTextControlProps ) {
	// Format types open their UI (e.g. the inline link popover via Cmd+K) in
	// portaled popovers. We host them in a private `SlotFillProvider` paired
	// with our own `Popover.Slot` (rendered below), wrapped in a marker
	// element. That way blur handling can tell precisely that focus moved into
	// a popover this control opened, rather than any popover that happens to be
	// on screen, and the popovers don't leak into an ambient slot registry.
	// The slot is portaled to the field's document body so popovers escape any
	// scroll/overflow container the control sits in (e.g. a sidebar). The body
	// is read from the field element rather than the global `document` to stay
	// correct if the control is ever rendered inside an iframe.
	const [ popoverSlotContainer, setPopoverSlotContainer ] =
		useState< HTMLElement >();
	const popoverSlotContainerRef = useRefEffect< HTMLDivElement >(
		( element ) => {
			setPopoverSlotContainer( element.ownerDocument.body );
		},
		[]
	);

	// When the textbox blurs, defer flipping the selection off so a
	// portal-rendered popover (e.g. the inline link UI opened via Cmd+K) can
	// claim focus without the consumer's `FormatEdit` -- and therefore the
	// popover itself -- unmounting underneath it.
	const blurDeselectTimeoutRef = useRef< ReturnType< typeof setTimeout > >();
	useEffect( () => () => clearTimeout( blurDeselectTimeoutRef.current ), [] );

	// The popover focus tracking below outlives individual renders, so read
	// the latest `onSelectedChange` from a ref instead of closing over a
	// possibly stale prop.
	const onSelectedChangeRef = useRef( onSelectedChange );
	useInsertionEffect( () => {
		onSelectedChangeRef.current = onSelectedChange;
	} );

	/*
	 * Once focus moves into one of the control's own popovers, the field has
	 * already blurred and its `onBlur` will not fire again when focus later
	 * leaves that popover. Watch document-level `focusout` for the duration
	 * of the popover excursion so the consumer still deselects (and tears down
	 * its format UI) once focus settles outside both the field and its
	 * popovers.
	 */
	const stopPopoverFocusTrackingRef = useRef< ( () => void ) | undefined >(
		undefined
	);
	useEffect( () => () => stopPopoverFocusTrackingRef.current?.(), [] );

	const editableWrapperRef = useRef< HTMLDivElement >( null );

	function trackPopoverFocusOut( ownerDocument: Document ) {
		stopPopoverFocusTrackingRef.current?.();

		function onDocumentFocusOut() {
			clearTimeout( blurDeselectTimeoutRef.current );
			blurDeselectTimeoutRef.current = setTimeout( () => {
				const active = ownerDocument.activeElement;
				if (
					( active &&
						editableWrapperRef.current?.contains( active ) ) ||
					( active && active.closest( OWNED_POPOVER_SELECTOR ) )
				) {
					return;
				}
				stopPopoverFocusTrackingRef.current?.();
				onSelectedChangeRef.current?.( false );
			}, 0 );
		}

		ownerDocument.addEventListener( 'focusout', onDocumentFocusOut );
		stopPopoverFocusTrackingRef.current = () => {
			ownerDocument.removeEventListener( 'focusout', onDocumentFocusOut );
			stopPopoverFocusTrackingRef.current = undefined;
		};
	}

	const focusOnMountRef = useRefEffect< HTMLDivElement >(
		( element ) => {
			if ( focusOnMount ) {
				element.focus();
			}
		},
		[ focusOnMount ]
	);

	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		hideLabelFromVision,
		label,
	} );

	return (
		<>
			<SlotFillProvider>
				{ children }
				{ popoverSlotContainer &&
					createPortal(
						<div data-rich-text-control-popover-slot>
							<Popover.Slot />
						</div>,
						popoverSlotContainer
					) }
			</SlotFillProvider>
			<BaseControl { ...baseControlProps }>
				<div
					className={ clsx( 'wp-rich-text-control', className ) }
					role="textbox"
					aria-multiline={ ! disableLineBreaks }
					aria-label={ label }
					ref={ useMergeRefs( [
						editableRef ?? null,
						editableWrapperRef,
						focusOnMountRef,
						popoverSlotContainerRef,
					] ) }
					onFocus={ () => {
						clearTimeout( blurDeselectTimeoutRef.current );
						// Focus is back in the field, so its own blur handling
						// takes over from the popover focus tracking again.
						stopPopoverFocusTrackingRef.current?.();
						onSelectedChange?.( true );
					} }
					onBlur={ ( event: FocusEvent< HTMLDivElement > ) => {
						clearTimeout( blurDeselectTimeoutRef.current );
						const { ownerDocument } = event.currentTarget;
						blurDeselectTimeoutRef.current = setTimeout( () => {
							// Stay selected if focus moved into a popover that a
							// format type opened from this control (e.g. the
							// inline link UI via Cmd+K). `@wordpress/components`
							// popovers are scoped to this control's own slot
							// (see `SlotFillProvider` above) and land inside the
							// `data-rich-text-control-popover-slot` marker, so we
							// match them precisely rather than treating any
							// on-screen popover as ours.
							// `[data-wp-compat-overlay-slot]` additionally covers
							// popovers already migrated to `@wordpress/ui`, which
							// portal into the shared compat overlay slot rather
							// than our own.
							const active = ownerDocument.activeElement;
							if (
								active &&
								active.closest( OWNED_POPOVER_SELECTOR )
							) {
								trackPopoverFocusOut( ownerDocument );
								return;
							}
							onSelectedChange?.( false );
						}, 0 );
					} }
					contentEditable
					suppressContentEditableWarning
					{ ...controlProps }
				/>
			</BaseControl>
		</>
	);
}

export default RichTextControl;
