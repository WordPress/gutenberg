/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { BaseControl, useBaseControlProps } from '@wordpress/components';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import {
	useInsertionEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useBlockEditorAutocompleteProps } from '../../autocomplete';
import { getAllowedFormats } from '../utils';
import FormatEdit from '../format-edit';
import shortcutsListener from '../event-listeners/shortcuts';
import inputEventsListener from '../event-listeners/input-events';
import { keyboardShortcutContext, inputEventContext } from '../';

const { useRichText } = unlock( richTextPrivateApis );

/**
 * A rich text control component that provides a contenteditable field with
 * formatting capabilities.
 *
 * Unlike the in-canvas `RichText` component, `RichTextControl` is intended for
 * standalone form fields (DataForms, sidebar inputs, etc.). It exposes a
 * straightforward `value` / `onChange` interface and skips block-editor
 * selection coupling, while still wiring registered format types and
 * (optionally) autocompleters such as inline mentions.
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
 * @param {Array}    [props.autocompleters]               Optional list of autocompleters (e.g. `@`-mention completers).
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
	autocompleters,
} ) {
	const [ selection, setSelection ] = useState( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef();
	const inputEvents = useRef( new Set() );
	const keyboardShortcuts = useRef( new Set() );

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

	const autocompleteProps = useBlockEditorAutocompleteProps( {
		completers: autocompleters,
		record: value,
		onChange: onRichTextChange,
	} );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision,
		label,
	} );

	function onFocus() {
		anchorRef.current?.focus();
	}

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
			// backtick→inline-code transform). Mirrors the format-rule
			// branch of `block-editor`'s `input-rules.js` listener without
			// pulling in its block-transform machinery, which doesn't
			// apply to a standalone field.
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
			{ isSelected && (
				<keyboardShortcutContext.Provider value={ keyboardShortcuts }>
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
			<BaseControl { ...baseControlProps }>
				<div
					{ ...autocompleteProps }
					className={ clsx(
						'block-editor-rich-text-control',
						className,
						autocompleteProps.className
					) }
					role="textbox"
					aria-multiline={ ! disableLineBreaks }
					aria-label={ label }
					ref={ useMergeRefs( [
						richTextRef,
						anchorRef,
						autocompleteProps.ref,
						eventListenersRef,
					] ) }
					onFocus={ () => setIsSelected( true ) }
					onBlur={ () => setIsSelected( false ) }
					contentEditable
					suppressContentEditableWarning
					{ ...controlProps }
				/>
			</BaseControl>
		</>
	);
}
