/**
 * External dependencies
 */
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
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

// The presentational shell. It owns the chrome (`BaseControl` + label, the
// `contentEditable` element, and the blur/focus selection heuristic) and has
// no `@wordpress/rich-text` dependency. This module is the "assembly" that
// injects the rich-text wiring into it.
const { RichTextControl: RichTextControlShell } = unlock(
	componentsPrivateApis
);

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

	// The shell exposes no focus management of its own (form controls leave
	// that to the surrounding region); focus the field on mount here when the
	// form opts in.
	const focusOnMountRef = useRefEffect< HTMLElement >(
		( element ) => {
			if ( focusOnMount ) {
				element.focus();
			}
		},
		[ focusOnMount ]
	);

	const editableRef = useMergeRefs( [
		richTextRef,
		anchorRef as MutableRefObject< HTMLElement | undefined >,
		eventListenersRef,
		enterRef,
		focusOnMountRef,
	] );

	return (
		<RichTextControlShell
			label={ label }
			id={ id }
			className={ className }
			hideLabelFromVision={ hideLabelFromVision }
			disableLineBreaks={ disableLineBreaks }
			ref={ editableRef }
			isSelected={ isSelected }
			onSelectedChange={ setIsSelected }
		>
			{ /* The shell mounts these only while the field is selected. */ }
			<KeyboardShortcutContext.Provider value={ keyboardShortcuts }>
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
		</RichTextControlShell>
	);
}
