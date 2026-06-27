/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { getAllowedFormats } from './utils';
import FormatEdit from './format-edit';
import shortcutsListener from './event-listeners/shortcuts';
import inputEventsListener from './event-listeners/input-events';

// `keyboardShortcutContext` / `inputEventContext` are the same context objects
// that `@wordpress/block-editor`'s `RichTextShortcut` / `RichTextInputEvent`
// read. Format types render those components, so providing these contexts here
// (below) is what wires their keyboard shortcuts and input events to this
// field even though the control lives outside `@wordpress/block-editor`.
const { useRichText, keyboardShortcutContext, inputEventContext } =
	unlock( richTextPrivateApis );

// Shared empty reference so the default `completers` value is stable across
// renders and the autocomplete hook doesn't re-run for consumers that don't
// opt into it.
const EMPTY_COMPLETERS = [];

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
 *
 * @param {Object}   props                                Component properties.
 * @param {string}   props.label                          Label text for the control.
 * @param {string}   props.value                          The rich text value (HTML string).
 * @param {Function} props.onChange                       Callback function invoked when the value changes.
 * @param {string}   [props.placeholder]                  Placeholder text displayed when the field is empty.
 * @param {string}   [props.id]                           Unique identifier for the control.
 * @param {string}   [props.clientId]                     Block client ID for context (used by format types that need it).
 * @param {string}   [props.className]                    Additional class name applied to the contenteditable element.
 * @param {boolean}  [props.hideLabelFromVision]          Whether to visually hide the label (still accessible to screen readers).
 * @param {Array}    [props.allowedFormats]               Array of allowed format types.
 * @param {boolean}  [props.disableFormats]               Whether to disable all formatting.
 * @param {boolean}  [props.withoutInteractiveFormatting] Whether to disable interactive formatting features.
 * @param {boolean}  [props.preserveWhiteSpace]           Whether to preserve whitespace in the content.
 * @param {boolean}  [props.disableLineBreaks]            Whether to disable line breaks in the content.
 * @param {boolean}  [props.focusOnMount]                 Whether to move focus to the field when it mounts. Off by default; opt in for standalone forms where no other code lands focus on the field.
 * @param {Array}    [props.completers]                   Autocompleters to wire to the field (e.g. an `@` mention completer). Each is a `WPCompleter` object as consumed by `@wordpress/components`' `Autocomplete`. Omit to disable autocomplete.
 *
 * @return {Element} The rendered RichTextControl component.
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
} ) {
	const [ selection, setSelection ] = useState( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef();
	const inputEvents = useRef( new Set() );
	const keyboardShortcuts = useRef( new Set() );

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
	const [ popoverSlotContainer, setPopoverSlotContainer ] = useState();
	const popoverSlotContainerRef = useRefEffect( ( element ) => {
		setPopoverSlotContainer( element.ownerDocument.body );
	}, [] );

	// When the textbox blurs, defer flipping `isSelected` to `false` so a
	// portal-rendered popover (e.g., the inline link UI opened via Cmd+K)
	// can claim focus without `FormatEdit` — and therefore the popover
	// itself — unmounting underneath it.
	const blurDeselectTimeoutRef = useRef( undefined );
	useEffect( () => () => clearTimeout( blurDeselectTimeoutRef.current ), [] );

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
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
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
	const { ref: autocompleteRef, ...autocompleteProps } = useAutocompleteProps(
		{
			completers,
			record: value,
			onChange: onRichTextChange,
		}
	);

	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision,
		label,
	} );

	function onFocus() {
		anchorRef.current?.focus();
	}

	// Optionally move focus to the field when it mounts. `RichTextControl`
	// has no block-editor selection to land focus, so standalone consumers
	// (e.g. a note form) need a way to land the caret on open.
	const focusOnMountRef = useRefEffect(
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
	const eventListenersPropsRef = useRef( {
		keyboardShortcuts,
		inputEvents,
	} );

	// Keep `formatTypes`/`getValue`/`onChange` accessible to the input-rule
	// listener without retearing it down on every value change.
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

	const eventListenersRef = useRefEffect(
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
			function onFormatInput( event ) {
				if (
					event.inputType !== 'insertText' &&
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
					( accumulator, { __unstableInputRule } ) =>
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
					<keyboardShortcutContext.Provider
						value={ keyboardShortcuts }
					>
						<inputEventContext.Provider value={ inputEvents }>
							<FormatEdit
								value={ value }
								onChange={ onRichTextChange }
								onFocus={ onFocus }
								formatTypes={ formatTypes }
								forwardedRef={ anchorRef }
								isVisible={ false }
							/>
						</inputEventContext.Provider>
					</keyboardShortcutContext.Provider>
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
						popoverSlotContainerRef,
						autocompleteRef,
					] ) }
					onFocus={ () => {
						clearTimeout( blurDeselectTimeoutRef.current );
						setIsSelected( true );
					} }
					onBlur={ ( event ) => {
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
								active.closest(
									'[data-rich-text-control-popover-slot],[data-wp-compat-overlay-slot]'
								)
							) {
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
