/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	SlotFillProvider,
	privateApis as componentsPrivateApis,
	__unstableUseAutocompleteProps as useAutocompleteProps,
} from '@wordpress/components';
import {
	useMergeRefs,
	useRefEffect,
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';
import {
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

// The completer shape isn't exported from `@wordpress/components`, so derive
// it from the autocomplete hook's own parameter type.
type Completer = Parameters<
	typeof useAutocompleteProps
>[ 0 ][ 'completers' ][ number ];

// Shared empty reference so the default `completers` value is stable across
// renders and the autocomplete hook doesn't re-run for consumers that don't
// opt into it.
const EMPTY_COMPLETERS: Array< Completer > = [];

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
	/**
	 * Autocompleters to wire to the field (e.g. an `@` mention completer).
	 * Each is a `WPCompleter` object as consumed by `@wordpress/components`'
	 * `Autocomplete`. Omit to disable autocomplete.
	 */
	completers?: Array< Completer >;
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
	const anchorRef = useRef< HTMLElement | undefined >( undefined );
	const inputEvents = useRef( new Set< ( event: Event ) => void >() );
	const keyboardShortcuts = useRef(
		new Set< ( event: KeyboardEvent ) => void >()
	);

	// The focus boundary (below) wraps the editable and its format UI. Format
	// popovers portal out of it in the DOM but still bubble focus events
	// through the React tree, so `useFocusOutside` deselects only once focus
	// leaves the field's own UI for good.
	const focusOutside = useFocusOutside( () => setIsSelected( false ) );

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

	/*
	 * Wire optional autocompleters (e.g. an `@` mention completer) to the
	 * field. The hook owns the editable element ref it anchors the popover to,
	 * so we merge its `ref` into the contenteditable below and spread the
	 * returned props (including the rendered popover as `children`). With no
	 * `completers` it does no work and renders nothing, keeping the control
	 * zero-cost for consumers that don't opt in.
	 */
	const { ref: autocompleteRef, ...autocompleteProps } = useAutocompleteProps(
		{
			completers,
			record: value,
			onChange: onRichTextChange,
			// This control's completers insert their completion into the value;
			// none replace the whole value, so the required `onReplace` is a
			// no-op here.
			onReplace: () => {},
		}
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
		anchorRef,
		eventListenersRef,
		enterRef,
		focusOnMountRef,
		autocompleteRef,
	] );

	return (
		// Focus boundary for the field's selection: `onFocus` selects on entry;
		// the spread `useFocusOutside` handlers deselect once focus leaves.
		<div
			{ ...focusOutside }
			onFocus={ ( event ) => {
				setIsSelected( true );
				focusOutside.onFocus( event );
			} }
		>
			{ /*
			 * Scopes the format types' `RichText.ToolbarControls.*` fills so
			 * they can't reach a surrounding block toolbar.
			 */ }
			<SlotFillProvider>
				<RichTextControlShell
					label={ label }
					id={ id }
					className={ clsx(
						'dataviews-controls__richtext',
						className
					) }
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
					{ ...autocompleteProps }
					ref={ editableRef }
				/>
				{ /*
				 * The format assembly mounts only while the field is selected —
				 * the shell is presentational and knows nothing about selection,
				 * so this module owns both the state and the gating.
				 */ }
				{ isSelected && ! disabled && (
					<KeyboardShortcutContext.Provider
						value={ keyboardShortcuts }
					>
						<InputEventContext.Provider value={ inputEvents }>
							{ /* Format types gate their inline UIs on `isVisible`. */ }
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
			</SlotFillProvider>
		</div>
	);
}
