/**
 * External dependencies
 */
import clsx from 'clsx';
import type { FocusEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Popover,
	SlotFillProvider,
	useBaseControlProps,
	__unstableUseAutocompleteProps as useAutocompleteProps,
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
import type { RichTextValue } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { getAllowedFormats } from './utils';
import FormatEdit from './format-edit';
import shortcutsListener from './event-listeners/shortcuts';
import inputEventsListener from './event-listeners/input-events';
import type { EventListenersProps } from './types';

// `KeyboardShortcutContext` / `InputEventContext` are the same context objects
// that `@wordpress/block-editor`'s `RichTextShortcut` / `RichTextInputEvent`
// read. Format types render those components, so providing these contexts here
// (below) is what wires their keyboard shortcuts and input events to this
// field even though the control lives outside `@wordpress/block-editor`.
const { useRichText, KeyboardShortcutContext, InputEventContext } =
	unlock( richTextPrivateApis );

// The completer shape isn't exported from `@wordpress/components`, so derive
// it from the autocomplete hook's own parameter type.
type Completer = Parameters<
	typeof useAutocompleteProps
>[ 0 ][ 'completers' ][ number ];

// Shared empty reference so the default `completers` value is stable across
// renders and the autocomplete hook doesn't re-run for consumers that don't
// opt into it.
const EMPTY_COMPLETERS: Array< Completer > = [];

// Popovers opened by this control's format types land either in the control's
// own portaled slot (see `SlotFillProvider` below) or, for popovers already
// migrated to `@wordpress/ui`, in the shared compat overlay slot.
const OWNED_POPOVER_SELECTOR =
	'[data-rich-text-control-popover-slot],[data-wp-compat-overlay-slot]';

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
	/**
	 * Autocompleters to wire to the field (e.g. an `@` mention completer).
	 * Each is a `WPCompleter` object as consumed by `@wordpress/components`'
	 * `Autocomplete`. Omit to disable autocomplete.
	 */
	completers?: Array< Completer >;
};

/**
 * A rich text control component that provides a contenteditable field with
 * formatting capabilities.
 *
 * Unlike the in-canvas `RichText` component from `@wordpress/block-editor`,
 * `RichTextControl` is intended for standalone form fields (DataForms, sidebar
 * inputs, etc.). It exposes a straightforward `value` / `onChange` interface
 * and skips block-editor selection coupling, while still wiring registered
 * format types so familiar keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K) continue
 * to work.
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
	allowedFormats,
	disableFormats,
	withoutInteractiveFormatting,
	preserveWhiteSpace,
	disableLineBreaks,
	focusOnMount,
	completers = EMPTY_COMPLETERS,
}: RichTextControlProps ) {
	const [ selection, setSelection ] = useState< {
		start: number | undefined;
		end: number | undefined;
	} >( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef< HTMLDivElement | undefined >( undefined );
	const inputEvents = useRef( new Set< ( event: Event ) => void >() );
	const keyboardShortcuts = useRef(
		new Set< ( event: KeyboardEvent ) => void >()
	);

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
	const popoverSlotContainerRef = useRefEffect< HTMLElement >(
		( element ) => {
			setPopoverSlotContainer( element.ownerDocument.body );
		},
		[]
	);

	// When the textbox blurs, defer flipping `isSelected` to `false` so a
	// portal-rendered popover (e.g., the inline link UI opened via Cmd+K)
	// can claim focus without `FormatEdit` — and therefore the popover
	// itself — unmounting underneath it.
	const blurDeselectTimeoutRef = useRef<
		ReturnType< typeof setTimeout > | undefined
	>( undefined );
	useEffect( () => () => clearTimeout( blurDeselectTimeoutRef.current ), [] );

	/*
	 * Once focus moves into one of the control's own popovers, the field has
	 * already blurred and its `onBlur` will not fire again when focus later
	 * leaves that popover. Watch document-level `focusout` for the duration
	 * of the popover excursion so the control still deselects (and tears down
	 * its format UI) once focus settles outside both the field and its
	 * popovers.
	 */
	const stopPopoverFocusTrackingRef = useRef< ( () => void ) | undefined >(
		undefined
	);
	useEffect( () => () => stopPopoverFocusTrackingRef.current?.(), [] );

	function trackPopoverFocusOut( ownerDocument: Document ) {
		stopPopoverFocusTrackingRef.current?.();

		function onDocumentFocusOut() {
			clearTimeout( blurDeselectTimeoutRef.current );
			blurDeselectTimeoutRef.current = setTimeout( () => {
				const active = ownerDocument.activeElement;
				if (
					( active && anchorRef.current?.contains( active ) ) ||
					( active && active.closest( OWNED_POPOVER_SELECTOR ) )
				) {
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

	// Wire optional autocompleters (e.g. an `@` mention completer) to the
	// field. The hook owns the editable element ref it anchors the popover to,
	// so we merge its `ref` into the contenteditable below and render the
	// returned popover. With no `completers` it does no work and renders
	// nothing, keeping the control zero-cost for consumers that don't opt in.
	// The hook anchors its popover to its own internal ref and overrides
	// whatever `contentRef` is passed, but the parameter type requires one.
	const unusedContentRef = useRef< HTMLElement >( null );
	const {
		ref: autocompleteRef,
		'aria-activedescendant': autocompleteActiveDescendant,
		'aria-autocomplete': autocompleteAriaAutocomplete,
		...autocompleteRest
	} = useAutocompleteProps( {
		completers,
		record: value,
		onChange: onRichTextChange,
		// This control's completers insert their completion into the value;
		// none replace the whole value, so the required `onReplace` is a
		// no-op here.
		onReplace: () => {},
		contentRef: unusedContentRef,
	} );
	// Normalize the hook's loosely-typed aria values for the DOM element:
	// `aria-activedescendant` may be `null` (React wants `undefined`) and
	// `aria-autocomplete` is only ever `'list'` or `undefined` at runtime.
	const autocompleteProps = {
		...autocompleteRest,
		'aria-activedescendant': autocompleteActiveDescendant ?? undefined,
		'aria-autocomplete': autocompleteAriaAutocomplete as 'list' | undefined,
	};

	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		hideLabelFromVision,
		label,
	} );

	function onFocus() {
		anchorRef.current?.focus();
	}

	// Optionally move focus to the field when it mounts. `RichTextControl`
	// has no block-editor selection to land focus, so standalone consumers
	// (e.g. a note form) need a way to land the caret on open.
	const focusOnMountRef = useRefEffect< HTMLElement >(
		( element ) => {
			if ( focusOnMount ) {
				element.focus();
			}
		},
		[ focusOnMount ]
	);

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
			function onKeyDown( event: KeyboardEvent ) {
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
			}
			element.addEventListener( 'keydown', onKeyDown );
			return () => element.removeEventListener( 'keydown', onKeyDown );
		},
		[ disableLineBreaks ]
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

	return (
		<>
			<SlotFillProvider>
				{ isSelected && (
					<KeyboardShortcutContext.Provider
						value={ keyboardShortcuts }
					>
						<InputEventContext.Provider value={ inputEvents }>
							<FormatEdit
								value={ value }
								onChange={ onRichTextChange }
								onFocus={ onFocus }
								formatTypes={ formatTypes }
								forwardedRef={ anchorRef }
								isVisible={ false }
							/>
						</InputEventContext.Provider>
					</KeyboardShortcutContext.Provider>
				) }
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
					{ ...autocompleteProps }
					ref={ useMergeRefs( [
						richTextRef,
						anchorRef,
						eventListenersRef,
						focusOnMountRef,
						enterRef,
						popoverSlotContainerRef,
						autocompleteRef,
					] ) }
					onFocus={ () => {
						clearTimeout( blurDeselectTimeoutRef.current );
						// Focus is back in the field, so its own blur handling
						// takes over from the popover focus tracking again.
						stopPopoverFocusTrackingRef.current?.();
						setIsSelected( true );
					} }
					onBlur={ ( event: FocusEvent< HTMLDivElement > ) => {
						clearTimeout( blurDeselectTimeoutRef.current );
						const ownerDocument = event.currentTarget.ownerDocument;
						blurDeselectTimeoutRef.current = setTimeout( () => {
							// Stay selected if focus moved into a popover that a
							// format type opened from this control (e.g. the
							// inline link UI via Cmd+K). `@wordpress/components`
							// popovers are scoped to this control's own slot
							// (see `SlotFillProvider` above) and land inside the
							// `data-rich-text-control-popover-slot` marker, so we
							// match them precisely rather than treating any
							// on-screen popover as ours. `[data-wp-compat-overlay-slot]`
							// additionally covers popovers already migrated to
							// `@wordpress/ui`, which portal into the shared
							// compat overlay slot rather than our own.
							const active = ownerDocument.activeElement;
							if (
								active &&
								active.closest( OWNED_POPOVER_SELECTOR )
							) {
								trackPopoverFocusOut( ownerDocument );
								return;
							}
							setIsSelected( false );
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
