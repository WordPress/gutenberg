/**
 * External dependencies
 */
import clsx from 'clsx';
import type { FocusEvent, MutableRefObject, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	Popover,
	SlotFillProvider,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import {
	createPortal,
	useEffect,
	useInsertionEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	insert,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import type { EventListenersProps, RichTextValue } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { getAllowedFormats } from './utils';
import FormatEdit from './format-edit';

// The presentational shell: `ContentEditableControl` owns the chrome
// (`BaseControl` + label and the `contentEditable` element) and has no
// `@wordpress/rich-text` dependency; the `Validated` wrapper adds the same
// required/validity treatment the sibling text controls get. This module is
// the "assembly" that injects the rich-text wiring into it.
const {
	ValidatedContentEditableControl: RichTextControlShell,
	withIgnoreIMEEvents,
} = unlock( componentsPrivateApis );

// `KeyboardShortcutContext` / `InputEventContext` are the same context objects
// that format types' `RichTextShortcut` / `RichTextInputEvent` read. Format
// types render those components, so providing these contexts here (below) is
// what wires their keyboard shortcuts and input events to this field.
// `shortcutsListener` / `inputEventsListener` dispatch the registered
// callbacks from the editable element's own events.
const {
	useRichText,
	KeyboardShortcutContext,
	InputEventContext,
	shortcutsListener,
	inputEventsListener,
} = unlock( richTextPrivateApis );

export type RichTextControlProps = {
	/**
	 * Label text for the control.
	 */
	label: string;
	/**
	 * The rich text value (HTML string).
	 */
	value: string;
	/**
	 * Callback function invoked when the value changes.
	 */
	onChange: ( value: string ) => void;
	/**
	 * Placeholder text displayed when the field is empty.
	 */
	placeholder?: string;
	/**
	 * Unique identifier for the control.
	 */
	id?: string;
	/**
	 * Block client ID for context (used by format types that need it).
	 */
	clientId?: string;
	/**
	 * Additional class name applied to the contenteditable element.
	 */
	className?: string;
	/**
	 * Whether to visually hide the label (still accessible to screen readers).
	 */
	hideLabelFromVision?: boolean;
	/**
	 * Help text displayed below the field and linked via `aria-describedby`.
	 */
	help?: ReactNode;
	/**
	 * Whether the field is non-editable.
	 */
	disabled?: boolean;
	/**
	 * Whether the field is required.
	 */
	required?: boolean;
	/**
	 * Label the field as "optional" when not `required`, instead of the
	 * inverse.
	 */
	markWhenOptional?: boolean;
	/**
	 * A custom validity message, matching the contract of the `Validated`
	 * form controls in `@wordpress/components`.
	 */
	customValidity?: {
		type: 'validating' | 'valid' | 'invalid';
		message?: string;
	};
	/**
	 * Array of allowed format types.
	 */
	allowedFormats?: string[];
	/**
	 * Whether to disable all formatting.
	 */
	disableFormats?: boolean;
	/**
	 * Whether to disable interactive formatting features.
	 */
	withoutInteractiveFormatting?: boolean;
	/**
	 * Whether to preserve whitespace in the content.
	 */
	preserveWhiteSpace?: boolean;
	/**
	 * Whether to disable line breaks in the content.
	 */
	disableLineBreaks?: boolean;
	/**
	 * Whether to move focus to the field when it mounts. Off by default; opt
	 * in for standalone forms where no other code lands focus on the field.
	 */
	focusOnMount?: boolean;
};

/**
 * Assembles a rich text form field by wiring `@wordpress/rich-text`
 * (`useRichText`, `FormatEdit`, keyboard-shortcut / input-event listeners)
 * into the presentational `RichTextControl` shell from
 * `@wordpress/components`.
 *
 * This is the counterpart to the in-canvas `RichText` component from
 * `@wordpress/block-editor`: it exposes a straightforward `value` / `onChange`
 * interface and skips block-editor selection coupling, while still wiring
 * registered format types so familiar keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K)
 * keep working.
 */
export default function RichTextControl( {
	label,
	value: attrValue,
	onChange,
	placeholder,
	id,
	clientId,
	className,
	hideLabelFromVision,
	help,
	disabled,
	required,
	markWhenOptional,
	customValidity,
	allowedFormats,
	disableFormats,
	withoutInteractiveFormatting,
	preserveWhiteSpace,
	disableLineBreaks,
	focusOnMount,
}: RichTextControlProps ) {
	const [ selection, setSelection ] = useState< {
		start: number | undefined;
		end: number | undefined;
	} >( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef< HTMLElement | undefined >( undefined );
	const inputEvents = useRef( new Set< ( event: Event ) => void >() );
	const keyboardShortcuts = useRef(
		new Set< ( event: KeyboardEvent ) => void >()
	);

	/*
	 * The assembly owns the selection ("active") lifetime, because only it
	 * can prove that a popover receiving focus belongs to this field: format
	 * popovers (e.g. the inline link UI opened via Cmd+K) portal into the
	 * `Popover.Slot` this component renders below inside its own
	 * `SlotFillProvider`, so "focus is in one of this field's popovers" is
	 * simply containment in that slot.
	 */
	const popoverSlotRef = useRef< HTMLDivElement | null >( null );
	/*
	 * Where the `Popover.Slot` portals to: the editable's `ownerDocument`
	 * body. The slot must not render inline where the field sits — form
	 * fields routinely live inside scroll containers (`overflow` ancestors
	 * clip the popovers) and transformed ancestors (which re-root the
	 * popovers' positioning). Portaling to the body mirrors where popovers
	 * land by default when no slot is present, while keeping the slot inside
	 * this field's `SlotFillProvider` (React context crosses portals) so the
	 * containment-based focus tracking above keeps working.
	 */
	const [ popoverContainer, setPopoverContainer ] =
		useState< HTMLElement | null >( null );
	const popoverContainerRef = useRefEffect< HTMLElement >( ( element ) => {
		setPopoverContainer( element.ownerDocument.body );
	}, [] );
	// When the editable blurs, defer flipping the selection off so a
	// portal-rendered popover can claim focus without `FormatEdit` — and
	// therefore the popover itself — unmounting underneath it.
	const blurDeselectTimeoutRef = useRef< ReturnType< typeof setTimeout > >();
	/*
	 * Once focus moves into one of the field's popovers, the editable has
	 * already blurred and its `onBlur` will not fire again when focus later
	 * leaves that popover. Watch document-level `focusout` for the duration
	 * of the popover excursion so the field still deselects (and tears down
	 * its format UI) once focus settles outside both the editable and its
	 * popovers.
	 */
	const stopPopoverFocusTrackingRef = useRef< ( () => void ) | undefined >(
		undefined
	);
	useEffect(
		() => () => {
			clearTimeout( blurDeselectTimeoutRef.current );
			stopPopoverFocusTrackingRef.current?.();
		},
		[]
	);

	function isFocusInField( ownerDocument: Document ) {
		const active = ownerDocument.activeElement;
		return !! (
			active &&
			( anchorRef.current?.contains( active ) ||
				popoverSlotRef.current?.contains( active ) )
		);
	}

	function trackPopoverFocusOut( ownerDocument: Document ) {
		stopPopoverFocusTrackingRef.current?.();

		function onDocumentFocusOut() {
			clearTimeout( blurDeselectTimeoutRef.current );
			blurDeselectTimeoutRef.current = setTimeout( () => {
				if ( isFocusInField( ownerDocument ) ) {
					return;
				}
				stopPopoverFocusTrackingRef.current?.();
				setIsSelected( false );
			}, 0 );
		}

		ownerDocument.addEventListener( 'focusout', onDocumentFocusOut );
		stopPopoverFocusTrackingRef.current = () => {
			ownerDocument.removeEventListener( 'focusout', onDocumentFocusOut );
			stopPopoverFocusTrackingRef.current = undefined;
		};
	}

	function onEditableFocus() {
		clearTimeout( blurDeselectTimeoutRef.current );
		// Focus is back in the editable, so its own blur handling takes over
		// from the popover focus tracking again.
		stopPopoverFocusTrackingRef.current?.();
		setIsSelected( true );
	}

	function onEditableBlur( event: FocusEvent< HTMLElement > ) {
		clearTimeout( blurDeselectTimeoutRef.current );
		const { ownerDocument } = event.currentTarget;
		blurDeselectTimeoutRef.current = setTimeout( () => {
			// Stay selected while focus is inside one of the popovers this
			// field's format UI opened.
			if ( isFocusInField( ownerDocument ) ) {
				trackPopoverFocusOut( ownerDocument );
				return;
			}
			setIsSelected( false );
		}, 0 );
	}

	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats,
		disableFormats,
	} );

	const {
		value,
		onChange: onRichTextChange,
		ref: richTextRef,
		formatTypes,
		getValue,
	} = useRichText( {
		value: attrValue,
		onChange,
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: (
			start: number | undefined,
			end: number | undefined
		) => setSelection( { start, end } ),
		__unstableIsSelected: isSelected,
		preserveWhiteSpace: !! preserveWhiteSpace,
		placeholder,
		__unstableDisableFormats: disableFormats,
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext: useMemo(
			() => ( {
				richTextIdentifier: id,
				blockClientId: clientId,
			} ),
			[ id, clientId ]
		),
	} );

	function onFocus() {
		anchorRef.current?.focus();
	}

	// Wire registered format keyboard shortcuts (e.g. Cmd+B, Cmd+I, Cmd+K)
	// and InputEvent handlers (e.g. native formatBold) to the contenteditable.
	// FormatEdit populates these Sets via context; without these listeners the
	// callbacks would never fire.
	const eventListenersPropsRef = useRef< EventListenersProps >( {
		keyboardShortcuts,
		inputEvents,
	} );

	// Keep `formatTypes`/`getValue`/`onChange` accessible to the input-rule
	// and Enter listeners without retearing them down on every value change.
	const inputRulePropsRef = useRef( {
		formatTypes,
		getValue,
		onChange: onRichTextChange,
	} );
	useInsertionEffect( () => {
		inputRulePropsRef.current = {
			formatTypes,
			getValue,
			onChange: onRichTextChange,
		};
	} );

	/*
	 * The rich-text hook has no Enter handling of its own. Left to the
	 * browser, Enter mutates the DOM directly with `<br>` elements (and
	 * Chrome appends an extra trailing break to keep the caret visible,
	 * which reads as two new lines). Mirror the block-editor behavior
	 * instead: prevent the native action and insert the line break into
	 * the value — or nothing when `disableLineBreaks` is set, matching
	 * the single-line semantics `aria-multiline` advertises. Presses with
	 * a meta/ctrl modifier are left to consumers (e.g. a form submitting
	 * on Cmd+Enter).
	 */
	const enterRef = useRefEffect< HTMLElement >(
		( element ) => {
			// A disabled field is not editable; nothing to handle. (Real
			// keyboard input cannot reach it either, since a
			// non-`contentEditable` div is not focusable.)
			if ( disabled ) {
				return;
			}
			// During IME composition (e.g. CJK input), Enter confirms the
			// composition rather than requesting a line break, so those
			// presses must reach the browser untouched.
			const onKeyDown = withIgnoreIMEEvents( ( event: KeyboardEvent ) => {
				if (
					event.key !== 'Enter' ||
					event.defaultPrevented ||
					event.metaKey ||
					event.ctrlKey
				) {
					return;
				}
				event.preventDefault();
				if ( disableLineBreaks ) {
					return;
				}
				const { getValue: getCurrentValue, onChange: handleChange } =
					inputRulePropsRef.current;
				const current: RichTextValue = getCurrentValue();
				// Fall back to the end of the content if the selection has
				// not been synced into the value yet.
				handleChange(
					insert(
						current,
						'\n',
						current.start ?? current.text.length,
						current.end ?? current.text.length
					)
				);
			} );
			element.addEventListener( 'keydown', onKeyDown );
			return () => element.removeEventListener( 'keydown', onKeyDown );
		},
		[ disableLineBreaks, disabled ]
	);

	const eventListenersRef = useRefEffect< HTMLElement >(
		( element ) => {
			if ( ! isSelected ) {
				return;
			}
			const cleanupShortcuts = shortcutsListener(
				eventListenersPropsRef
			)( element );
			const cleanupInputEvents = inputEventsListener(
				eventListenersPropsRef
			)( element );

			// Apply format-level input rules (e.g. `core/code`'s
			// backtick→inline-code transform). Block-transform input rules
			// don't apply to a standalone field.
			function onFormatInput( event: Event ) {
				if (
					( event as InputEvent ).inputType !== 'insertText' &&
					event.type !== 'compositionend'
				) {
					return;
				}
				const {
					formatTypes: types,
					getValue: getCurrentValue,
					onChange: handleChange,
				} = inputRulePropsRef.current;
				const current = getCurrentValue();
				const transformed = types.reduce(
					(
						accumulator: RichTextValue,
						{
							__unstableInputRule,
						}: {
							__unstableInputRule?: (
								value: RichTextValue
							) => RichTextValue;
						}
					) =>
						__unstableInputRule
							? __unstableInputRule( accumulator )
							: accumulator,
					current
				);
				if ( transformed !== current ) {
					handleChange( {
						...transformed,
						activeFormats: current.activeFormats,
					} );
				}
			}
			element.addEventListener( 'input', onFormatInput );
			element.addEventListener( 'compositionend', onFormatInput );

			return () => {
				cleanupShortcuts();
				cleanupInputEvents();
				element.removeEventListener( 'input', onFormatInput );
				element.removeEventListener( 'compositionend', onFormatInput );
			};
		},
		[ isSelected ]
	);

	// The shell exposes no focus management of its own (form controls leave
	// that to the surrounding region); focus the field on mount here when the
	// form opts in.
	const focusOnMountRef = useRefEffect< HTMLElement >(
		( element ) => {
			if ( focusOnMount && ! disabled ) {
				element.focus();
			}
		},
		[ focusOnMount, disabled ]
	);

	const editableRef = useMergeRefs( [
		richTextRef,
		anchorRef as MutableRefObject< HTMLElement | undefined >,
		eventListenersRef,
		enterRef,
		focusOnMountRef,
		popoverContainerRef,
	] );

	return (
		/*
		 * The provider scopes every slot/fill rendered by this field — most
		 * importantly the format popovers, which land in the `Popover.Slot`
		 * below. That containment is what the blur handling above checks to
		 * decide whether focus is still within the field's own UI. A format
		 * popover using a custom `__unstableSlotName` would portal to the
		 * body-level fallback container instead and deselect the field;
		 * `core/link` (and every other core format) uses the default slot.
		 */
		<SlotFillProvider>
			<RichTextControlShell
				label={ label }
				id={ id }
				className={ clsx( 'dataviews-controls__richtext', className ) }
				// The shell draws this while the element is empty, and the
				// rich-text hook below renders its own placeholder element
				// once it takes over the contents; either way the attribute
				// keeps `aria-placeholder` exposed to assistive technology.
				placeholder={ placeholder }
				hideLabelFromVision={ hideLabelFromVision }
				help={ help }
				disabled={ disabled }
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				// The shell manages the editable content through the ref; the
				// plain text only drives its hidden validity delegate.
				value={ value.text }
				aria-multiline={ ! disableLineBreaks }
				ref={ editableRef }
				onFocus={ onEditableFocus }
				onBlur={ onEditableBlur }
			/>
			{ /*
			 * The format assembly mounts only while the field is selected —
			 * the shell is presentational and knows nothing about selection,
			 * so this module owns both the state and the gating.
			 */ }
			{ isSelected && ! disabled && (
				<KeyboardShortcutContext.Provider value={ keyboardShortcuts }>
					<InputEventContext.Provider value={ inputEvents }>
						{ /*
						 * Format types gate both their toolbar buttons and
						 * their inline UIs (e.g. the link popover opened via
						 * Cmd+K) on `isVisible`. A standalone field renders no
						 * `RichText.ToolbarControls` slot, so the
						 * toolbar-button fills mount into nothing while the
						 * inline UIs stay functional.
						 */ }
						<FormatEdit
							value={ value }
							onChange={ onRichTextChange }
							onFocus={ onFocus }
							formatTypes={ formatTypes }
							forwardedRef={ anchorRef }
							isVisible
						/>
					</InputEventContext.Provider>
				</KeyboardShortcutContext.Provider>
			) }
			{ popoverContainer &&
				createPortal(
					<Popover.Slot ref={ popoverSlotRef } />,
					popoverContainer
				) }
		</SlotFillProvider>
	);
}
