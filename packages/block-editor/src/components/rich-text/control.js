/**
 * WordPress dependencies
 */
import { BaseControl, useBaseControlProps } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import {
	__unstableUseRichText as useRichText,
	removeFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { useFormatTypes } from './use-format-types';
import { getAllowedFormats } from './utils';
import { useEventListeners } from './event-listeners';
import FormatEdit from './format-edit';
import { keyboardShortcutContext, inputEventContext } from './';

/**
 * A rich text control component that provides a contenteditable field with formatting capabilities.
 *
 * @param {Object}   props                              Component properties.
 * @param {string}   props.label                        Label text for the control.
 * @param {string}   props.value                        The rich text value (HTML string).
 * @param {Function} props.onChange                     Callback function invoked when the value changes.
 * @param {string}   props.placeholder                  Placeholder text displayed when the field is empty.
 * @param {string}   props.id                           Unique identifier for the control.
 * @param {string}   props.clientId                     Block client ID for context.
 * @param {boolean}  props.hideLabelFromVision          Whether to visually hide the label (still accessible to screen readers).
 * @param {Array}    props.allowedFormats               Array of allowed format types.
 * @param {boolean}  props.disableFormats               Whether to disable all formatting.
 * @param {boolean}  props.withoutInteractiveFormatting Whether to disable interactive formatting features.
 * @param {boolean}  props.preserveWhiteSpace           Whether to preserve whitespace in the content.
 * @param {boolean}  props.disableLineBreaks            Whether to disable line breaks in the content.
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
	hideLabelFromVision,
	allowedFormats,
	disableFormats,
	withoutInteractiveFormatting,
	preserveWhiteSpace,
	disableLineBreaks,
} ) {
	const registry = useRegistry();
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
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	} = useFormatTypes( {
		clientId,
		identifier: id,
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting,
		disableNoneEssentialFormatting: true,
	} );

	function addEditorOnlyFormats( value ) {
		return valueHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
	}

	function removeEditorOnlyFormats( value ) {
		formatTypes.forEach( ( formatType ) => {
			// Remove formats created by prepareEditableTree, because they are editor only.
			if ( formatType.__experimentalCreatePrepareEditableTree ) {
				value = removeFormat(
					value,
					formatType.name,
					0,
					value.text.length
				);
			}
		} );

		return value.formats;
	}

	function addInvisibleFormats( value ) {
		return prepareHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
	}

	function onFocus() {
		anchorRef.current?.focus();
	}

	const {
		value,
		getValue,
		onChange: onRichTextChange,
		ref: richTextRef,
	} = useRichText( {
		value: attrValue,
		onChange( html, { __unstableFormats, __unstableText } ) {
			onChange( html );
			Object.values( changeHandlers ).forEach( ( changeHandler ) => {
				changeHandler( __unstableFormats, __unstableText );
			} );
		},
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
		__unstableIsSelected: isSelected,
		preserveWhiteSpace: !! preserveWhiteSpace,
		placeholder,
		__unstableDisableFormats: disableFormats,
		__unstableDependencies: dependencies,
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision,
		label,
	} );

	return (
		<>
			{ isSelected && (
				<keyboardShortcutContext.Provider value={ keyboardShortcuts }>
					<inputEventContext.Provider value={ inputEvents }>
						<div>
							<FormatEdit
								value={ value }
								onChange={ onRichTextChange }
								onFocus={ onFocus }
								formatTypes={ formatTypes }
								forwardedRef={ anchorRef }
								isVisible={ false }
							/>
						</div>
					</inputEventContext.Provider>
				</keyboardShortcutContext.Provider>
			) }
			<BaseControl { ...baseControlProps }>
				<div
					className="block-editor-content-only-controls__rich-text"
					role="textbox"
					aria-multiline={ ! disableLineBreaks }
					ref={ useMergeRefs( [
						richTextRef,
						useEventListeners( {
							registry,
							getValue,
							onChange: onRichTextChange,
							formatTypes,
							selectionChange: setSelection,
							isSelected,
							disableFormats,
							value,
							tagName: 'div',
							removeEditorOnlyFormats,
							disableLineBreaks,
							keyboardShortcuts,
							inputEvents,
						} ),
						anchorRef,
					] ) }
					onFocus={ () => setIsSelected( true ) }
					onBlur={ () => setIsSelected( false ) }
					contentEditable
					{ ...controlProps }
				/>
			</BaseControl>
		</>
	);
}
