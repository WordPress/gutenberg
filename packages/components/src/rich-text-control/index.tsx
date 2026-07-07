/**
 * External dependencies
 */
import clsx from 'clsx';
import type { FocusEvent, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useEvent, useMergeRefs } from '@wordpress/compose';
import { forwardRef, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { useBaseControlProps } from '../base-control/hooks';
import type { WordPressComponentProps } from '../context';
import { useControlledValue } from '../utils/hooks';
import type { RichTextControlProps } from './types';

/*
 * Format popovers opened from this control render into whatever popover
 * container is in scope: an ambient `Popover.Slot` when a provider exists up
 * the tree, the body-level fallback container otherwise, or -- for popovers
 * already migrated to `@wordpress/ui` -- the shared compat overlay slot. Blur
 * handling treats focus inside any of these containers as "still in the
 * field's popover". That trades a little precision (an unrelated popover in
 * the same container also matches) for using the popover primitives as-is;
 * in practice, reaching an unrelated popover moves focus through a
 * non-popover element first, which already deselects the field.
 */
const POPOVER_CONTAINER_SELECTOR =
	'.popover-slot,.components-popover__fallback-container,[data-wp-compat-overlay-slot]';

/**
 * A presentational rich text control: a labeled `contentEditable` form field
 * with the selection tracking format popovers need.
 *
 * Unlike the in-canvas `RichText` from `@wordpress/block-editor`, this control
 * is intended for standalone form fields (DataForms, sidebar inputs, etc.).
 * It is deliberately **presentational only** and has no `@wordpress/rich-text`
 * dependency: the editable behavior (value, formatting, keyboard shortcuts) is
 * injected by the consumer through the forwarded ref and `children`. The
 * consumer owns the `useRichText` wiring; this component owns the chrome
 * (`BaseControl` + label and the editable element).
 *
 * The selection ("active") state can be controlled through the `isSelected`
 * prop or left uncontrolled; either way `children` are mounted only while the
 * field is selected.
 *
 * @example
 * ```jsx
 * // The rich-text "assembly" lives in the consumer.
 * <RichTextControl
 *     label="Caption"
 *     ref={ mergedRef }
 *     isSelected={ isSelected }
 *     onSelectedChange={ setIsSelected }
 * >
 *     <KeyboardShortcutContext.Provider value={ shortcuts }>
 *         <FormatEdit … />
 *     </KeyboardShortcutContext.Provider>
 * </RichTextControl>
 * ```
 */
function UnforwardedRichTextControl(
	{
		label,
		isSelected: isSelectedProp,
		defaultIsSelected,
		onSelectedChange,
		children,
		id,
		className,
		hideLabelFromVision,
		disableLineBreaks,
		onFocus,
		onBlur,
		...additionalProps
	}: WordPressComponentProps< RichTextControlProps, 'div', false >,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	// Selection ("active") state, usable both controlled (`isSelected`) and
	// uncontrolled (`defaultIsSelected` + internal state). Either way,
	// `onSelectedChange` reports the focus/blur transitions the control
	// derives below.
	const [ isSelected = false, setIsSelected ] = useControlledValue( {
		value: isSelectedProp,
		defaultValue: defaultIsSelected,
		onChange: onSelectedChange,
	} );
	// When the textbox blurs, defer flipping the selection off so a
	// portal-rendered popover (e.g. the inline link UI opened via Cmd+K) can
	// claim focus without the consumer's `FormatEdit` -- and therefore the
	// popover itself -- unmounting underneath it.
	const blurDeselectTimeoutRef = useRef< ReturnType< typeof setTimeout > >();
	useEffect( () => () => clearTimeout( blurDeselectTimeoutRef.current ), [] );

	// The popover focus tracking below outlives individual renders, so call
	// the setter through a stable reference instead of closing over a possibly
	// stale one.
	const setSelected = useEvent( ( next: boolean ) => {
		setIsSelected?.( next );
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
					( active && active.closest( POPOVER_CONTAINER_SELECTOR ) )
				) {
					return;
				}
				stopPopoverFocusTrackingRef.current?.();
				setSelected( false );
			}, 0 );
		}

		ownerDocument.addEventListener( 'focusout', onDocumentFocusOut );
		stopPopoverFocusTrackingRef.current = () => {
			ownerDocument.removeEventListener( 'focusout', onDocumentFocusOut );
			stopPopoverFocusTrackingRef.current = undefined;
		};
	}

	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		hideLabelFromVision,
		label,
	} );

	return (
		<>
			{ isSelected && children }
			<BaseControl { ...baseControlProps }>
				<div
					className={ clsx( 'wp-rich-text-control', className ) }
					role="textbox"
					aria-multiline={ ! disableLineBreaks }
					aria-label={ label }
					ref={ useMergeRefs( [ forwardedRef, editableWrapperRef ] ) }
					onFocus={ ( event: FocusEvent< HTMLDivElement > ) => {
						onFocus?.( event );
						clearTimeout( blurDeselectTimeoutRef.current );
						// Focus is back in the field, so its own blur handling
						// takes over from the popover focus tracking again.
						stopPopoverFocusTrackingRef.current?.();
						setSelected( true );
					} }
					onBlur={ ( event: FocusEvent< HTMLDivElement > ) => {
						onBlur?.( event );
						clearTimeout( blurDeselectTimeoutRef.current );
						const { ownerDocument } = event.currentTarget;
						blurDeselectTimeoutRef.current = setTimeout( () => {
							// Stay selected if focus moved into a popover
							// container, i.e. (approximately) a popover that a
							// format type opened from this control, such as the
							// inline link UI via Cmd+K. See
							// `POPOVER_CONTAINER_SELECTOR` above.
							const active = ownerDocument.activeElement;
							if (
								active &&
								active.closest( POPOVER_CONTAINER_SELECTOR )
							) {
								trackPopoverFocusOut( ownerDocument );
								return;
							}
							setSelected( false );
						}, 0 );
					} }
					contentEditable
					suppressContentEditableWarning
					{ ...additionalProps }
					{ ...controlProps }
				/>
			</BaseControl>
		</>
	);
}

export const RichTextControl = forwardRef( UnforwardedRichTextControl );
RichTextControl.displayName = 'RichTextControl';

export default RichTextControl;
