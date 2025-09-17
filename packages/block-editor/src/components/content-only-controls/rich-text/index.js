/**
 * WordPress dependencies
 */
import {
	BaseControl,
	useBaseControlProps,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import {
	__unstableUseRichText as useRichText,
	isEmpty,
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
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	const registry = useRegistry();
	const valueKey = control.mapping.value;
	const attrValue = attributeValues[ valueKey ];
	const defaultValue =
		blockType.attributes[ valueKey ]?.defaultValue ?? undefined;
	const [ selection, setSelection ] = useState( {
		start: undefined,
		end: undefined,
	} );
	const [ isSelected, setIsSelected ] = useState( false );
	const anchorRef = useRef();
	const inputEvents = useRef( new Set() );
	const keyboardShortcuts = useRef( new Set() );

	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats: control.args?.allowedFormats,
		disableFormats: control.args?.disableFormats,
	} );

	const {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	} = useFormatTypes( {
		clientId,
		identifier: valueKey,
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting:
			control.args?.withoutInteractiveFormatting,
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
		onChange,
		ref: richTextRef,
	} = useRichText( {
		value: attrValue,
		onChange( html, { __unstableFormats, __unstableText } ) {
			updateAttributes( { [ valueKey ]: html } );
			Object.values( changeHandlers ).forEach( ( changeHandler ) => {
				changeHandler( __unstableFormats, __unstableText );
			} );
		},
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
		__unstableIsSelected: isSelected,
		preserveWhiteSpace: !! control.args?.preserveWhiteSpace,
		placeholder: control.args?.placeholder,
		__unstableDisableFormats: control.args?.disableFormats,
		__unstableDependencies: dependencies,
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		hideLabelFromVision: control.shownByDefault,
		label: control.label,
	} );

	return (
		<ToolsPanelItem
			panelId={ clientId }
			label={ control.label }
			hasValue={ () => {
				return value?.text && ! isEmpty( value );
			} }
			onDeselect={ () =>
				updateAttributes( { [ valueKey ]: defaultValue } )
			}
			isShownByDefault={ control.shownByDefault }
		>
			{ isSelected && (
				<keyboardShortcutContext.Provider value={ keyboardShortcuts }>
					<inputEventContext.Provider value={ inputEvents }>
						<div>
							<FormatEdit
								value={ value }
								onChange={ onChange }
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
					aria-multiline={ ! control.args?.disableLineBreaks }
					ref={ useMergeRefs( [
						richTextRef,
						useEventListeners( {
							registry,
							getValue,
							onChange,
							formatTypes,
							selectionChange: setSelection,
							isSelected,
							disableFormats: control.args?.disableFormats,
							value,
							tagName: 'div',
							removeEditorOnlyFormats,
							disableLineBreaks: control.args?.disableLineBreaks,
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
		</ToolsPanelItem>
	);
}
