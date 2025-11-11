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
import { useFormatTypes } from '../../rich-text/use-format-types';
import { getAllowedFormats } from '../../rich-text/utils';
import { useEventListeners } from '../../rich-text/event-listeners';
import FormatEdit from '../../rich-text/format-edit';
import { keyboardShortcutContext, inputEventContext } from '../../rich-text';

/**
 * RichTextEdit component for DataForm integration.
 * Provides rich text editing capabilities compatible with DataForm's Edit component API.
 *
 * @param {Object}   props                     - Component props.
 * @param {Object}   props.data                - Block attributes.
 * @param {Object}   props.field               - DataForm field configuration.
 * @param {Function} props.onChange            - Callback for value changes.
 * @param {boolean}  props.hideLabelFromVision - Whether to hide the label.
 */
export default function RichTextEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
} ) {
	const registry = useRegistry();
	const valueKey = field.id;
	const attrValue = data[ valueKey ];

	const [ selection, setSelection ] = useState( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef();
	const inputEvents = useRef( new Set() );
	const keyboardShortcuts = useRef( new Set() );

	// Extract Edit config (control-specific options like allowedFormats, etc.)
	const editConfig = field.Edit || {};
	const allowedFormats =
		editConfig.allowedFormats || editConfig.args?.allowedFormats;
	const disableFormats =
		editConfig.disableFormats || editConfig.args?.disableFormats;

	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats,
		disableFormats,
	} );

	const { formatTypes, prepareHandlers, valueHandlers, dependencies } =
		useFormatTypes( {
			identifier: valueKey,
			allowedFormats: adjustedAllowedFormats,
			withoutInteractiveFormatting:
				editConfig.withoutInteractiveFormatting ?? false,
			disableNoneEssentialFormatting:
				editConfig.disableNoneEssentialFormatting ?? true,
		} );

	function addEditorOnlyFormats( value ) {
		return valueHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
	}

	function removeEditorOnlyFormats( value ) {
		formatTypes.forEach( ( formatType ) => {
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
		onChange: richTextOnChange,
		ref: richTextRef,
	} = useRichText( {
		value: attrValue,
		onChange( html ) {
			// Call DataForm's onChange with the updated value
			onChange( { [ valueKey ]: html } );
		},
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
		__unstableIsSelected: isSelected,
		preserveWhiteSpace: !! editConfig.preserveWhiteSpace,
		placeholder: editConfig.placeholder || field.placeholder,
		__unstableDisableFormats: disableFormats,
		__unstableDependencies: dependencies,
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision,
		label: field.label,
	} );

	return (
		<>
			{ isSelected && (
				<keyboardShortcutContext.Provider value={ keyboardShortcuts }>
					<inputEventContext.Provider value={ inputEvents }>
						<div>
							<FormatEdit
								value={ value }
								onChange={ richTextOnChange }
								onFocus={ onFocus }
								formatTypes={ formatTypes }
								forwardedRef={ anchorRef }
								isVisible={ false }
							/>
						</div>
					</inputEventContext.Provider>
				</keyboardShortcutContext.Provider>
			) }
			<BaseControl __nextHasNoMarginBottom { ...baseControlProps }>
				<div
					className="block-editor-content-only-controls__rich-text"
					role="textbox"
					aria-multiline={ ! editConfig.disableLineBreaks ?? true }
					ref={ useMergeRefs( [
						richTextRef,
						useEventListeners( {
							registry,
							getValue,
							onChange: richTextOnChange,
							formatTypes,
							selectionChange: setSelection,
							isSelected,
							disableFormats,
							value,
							tagName: 'div',
							removeEditorOnlyFormats,
							disableLineBreaks: editConfig.disableLineBreaks,
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
