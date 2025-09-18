/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	TextControl,
} from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

export default function PlainText( {
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	const valueKey = control.mapping.value;
	const value = attributeValues[ valueKey ];
	const defaultValue =
		blockType.attributes[ valueKey ]?.defaultValue ?? undefined;

	return (
		<ToolsPanelItem
			panelId={ clientId }
			label={ control.label }
			hasValue={ () => {
				return (
					value !== defaultValue && stripHTML( value )?.length !== 0
				);
			} }
			onDeselect={ () => {
				updateAttributes( { [ valueKey ]: defaultValue } );
			} }
			isShownByDefault={ control.shownByDefault }
		>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ control.label }
				value={ value ? stripHTML( value ) : '' }
				onChange={ ( newValue ) => {
					updateAttributes( { [ valueKey ]: newValue } );
				} }
				autoComplete="off"
				hideLabelFromVision={ control.shownByDefault }
			/>
		</ToolsPanelItem>
	);
}
