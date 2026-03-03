/**
 * WordPress dependencies
 */
import { BaseControl, useBaseControlProps } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import { useMemo, useRef, useState } from '@wordpress/element';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { getAllowedFormats } from '../../../components/rich-text/utils';
import { useEventListeners } from '../../../components/rich-text/event-listeners';
import FormatEdit from '../../../components/rich-text/format-edit';
import {
	keyboardShortcutContext,
	inputEventContext,
} from '../../../components/rich-text';
import { unlock } from '../../../lock-unlock';

const { useRichText } = unlock( richTextPrivateApis );

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

	function onFocus() {
		anchorRef.current?.focus();
	}

	const {
		value,
		getValue,
		onChange: onRichTextChange,
		ref: richTextRef,
		formatTypes,
	} = useRichText( {
		value: attrValue,
		onChange( html ) {
			onChange( field.setValue( { item: data, value: html } ) );
		},
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
		__unstableIsSelected: isSelected,
		preserveWhiteSpace: !! fieldConfig?.preserveWhiteSpace,
		placeholder: fieldConfig?.placeholder,
		__unstableDisableFormats: fieldConfig?.disableFormats,
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting: fieldConfig?.withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext: useMemo(
			() => ( { richTextIdentifier: field.id, blockClientId: clientId } ),
			[ field.id, clientId ]
		),
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
