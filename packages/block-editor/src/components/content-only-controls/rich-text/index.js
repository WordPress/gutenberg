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

export default function RichTextControl( {
	data,
	field,
	hideLabelFromVision,
	onChange,
	config = {},
} ) {
	const registry = useRegistry();
	const attrValue = field.getValue( { item: data } );
	const fieldConfig = field.config || {};
	const { clientId } = config;
	const updateAttributes = ( html ) => {
		const mappedChanges = field.setValue( { item: data, value: html } );
		onChange( mappedChanges );
	};
	const [ selection, setSelection ] = useState( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef();
	const inputEvents = useRef( new Set() );
	const keyboardShortcuts = useRef( new Set() );

	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats: fieldConfig?.allowedFormats,
		disableFormats: fieldConfig?.disableFormats,
	} );

	const {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	} = useFormatTypes( {
		clientId,
		identifier: field.id,
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting: fieldConfig?.withoutInteractiveFormatting,
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
			updateAttributes( html );
			Object.values( changeHandlers ).forEach( ( changeHandler ) => {
				changeHandler( __unstableFormats, __unstableText );
			} );
		},
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
		__unstableIsSelected: isSelected,
		preserveWhiteSpace: !! fieldConfig?.preserveWhiteSpace,
		placeholder: fieldConfig?.placeholder,
		__unstableDisableFormats: fieldConfig?.disableFormats,
		__unstableDependencies: dependencies,
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision: hideLabelFromVision ?? field.hideLabelFromVision,
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
					aria-multiline={ ! fieldConfig?.disableLineBreaks }
					ref={ useMergeRefs( [
						richTextRef,
						useEventListeners( {
							registry,
							getValue,
							onChange: onRichTextChange,
							formatTypes,
							selectionChange: setSelection,
							isSelected,
							disableFormats: fieldConfig?.disableFormats,
							value,
							tagName: 'div',
							removeEditorOnlyFormats,
							disableLineBreaks: fieldConfig?.disableLineBreaks,
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
