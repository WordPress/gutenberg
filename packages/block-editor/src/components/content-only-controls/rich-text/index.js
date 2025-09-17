/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useState } from '@wordpress/element';
import {
	__unstableUseRichText as useRichText,
	// removeFormat,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { useFormatTypes } from '../rich-text';

export default function RichTextControl( {
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	const instanceId = useInstanceId( RichTextControl );
	const controlId = `block-editor-content-only-controls__rich-text-${ instanceId }`;
	const valueKey = control.mapping.value;
	const attrValue = attributeValues[ valueKey ];
	const defaultValue =
		blockType.attributes[ valueKey ]?.defaultValue ?? undefined;
	const [ selection, setSelection ] = useState( {
		start: undefined,
		end: undefined,
	} );

	// const {
	// 	formatTypes,
	// 	prepareHandlers,
	// 	valueHandlers,
	// 	changeHandlers,
	// 	dependencies,
	// } = useFormatTypes( {
	// 	clientId,
	// 	identifier,
	// 	allowedFormats: adjustedAllowedFormats,
	// 	withoutInteractiveFormatting,
	// 	disableNoneEssentialFormatting: isContentOnlyWriteMode,
	// } );

	const { value, ref: richTextRef } = useRichText( {
		value: attrValue,
		onChange( html, { __unstableFormats, __unstableText } ) {
			updateAttributes( { [ valueKey ]: html } );
			// Object.values( changeHandlers ).forEach( ( changeHandler ) => {
			// 	changeHandler( __unstableFormats, __unstableText );
			// } );
		},
		selectionStart: selection.start,
		selectionEnd: selection.end,
		onSelectionChange: ( start, end ) => setSelection( { start, end } ),
		// placeholder: bindingsPlaceholder || placeholder,
		// __unstableIsSelected: isSelected,
		// __unstableDisableFormats: disableFormats,
		// preserveWhiteSpace,
		// __unstableDependencies: dependencies,
		// __unstableAfterParse: addEditorOnlyFormats,
		// __unstableBeforeSerialize: removeEditorOnlyFormats,
		// __unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	const hasVisibleLabel = ! control.shownByDefault;

	return (
		<ToolsPanelItem
			panelId={ clientId }
			label={ control.label }
			hasValue={ () => {
				return (
					value !== defaultValue && stripHTML( value )?.length !== 0
				);
			} }
			onDeselect={ () => {} }
			isShownByDefault={ control.shownByDefault }
		>
			{ hasVisibleLabel && (
				<label htmlFor={ controlId }>{ control.label }</label>
			) }
			<div
				tagName="div"
				role="textbox"
				id={ hasVisibleLabel ? controlId : undefined }
				className="block-editor-content-only-controls__rich-text"
				aria-label={ hasVisibleLabel ? undefined : control.label }
				aria-multiline={ ! control.args?.disableLineBreaks }
				ref={ useMergeRefs( [ richTextRef ] ) }
				contentEditable
			/>
		</ToolsPanelItem>
	);
}
