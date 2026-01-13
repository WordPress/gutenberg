/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	ContrastChecker,
} from '@wordpress/block-editor';

function ContrastCheckerMatrix( { attributes, activeBackgroundColor, activeTextColor, hoverBackgroundColor, hoverTextColor } ) {
	const {
		customActiveBackgroundColor,
		customActiveTextColor,
		customHoverBackgroundColor,
		customHoverTextColor,
		backgroundColor,
		textColor,
		fontSize,
	} = attributes;

	const activeBackground = activeBackgroundColor?.color ?? customActiveBackgroundColor;
	const activeText = activeTextColor?.color ?? customActiveTextColor;
	const hoverBackground = hoverBackgroundColor?.color ?? customHoverBackgroundColor;
	const hoverText = hoverTextColor?.color ?? customHoverTextColor;

	return (
		<>
			<ContrastChecker
				backgroundColor={ backgroundColor }
				fontSize={ fontSize }
				textColor={ textColor }
			/>
			<ContrastChecker
				backgroundColor={ activeBackground }
				fontSize={ fontSize }
				textColor={ activeText }
			/>
			<ContrastChecker
				backgroundColor={ hoverBackground }
				fontSize={ fontSize }
				textColor={ hoverText }
			/>
		</>
	);
}

export default function Controls( {
	attributes,
	setAttributes,
	clientId,
	activeBackgroundColor,
	setActiveBackgroundColor,
	activeTextColor,
	setActiveTextColor,
	hoverBackgroundColor,
	setHoverBackgroundColor,
	hoverTextColor,
	setHoverTextColor,
} ) {
	const {
		customActiveBackgroundColor,
		customActiveTextColor,
		customHoverBackgroundColor,
		customHoverTextColor,
	} = attributes;

	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<InspectorControls group="color">
			<ColorGradientSettingsDropdown
				settings={ [
					{
						label: __( 'Active Background' ),
						colorValue:
							activeBackgroundColor?.color ?? customActiveBackgroundColor,
						onColorChange: ( value ) => {
							setActiveBackgroundColor( value );
							setAttributes( {
								customActiveBackgroundColor: value,
							} );
						},
					},
					{
						label: __( 'Active Text' ),
						colorValue:
							activeTextColor?.color ?? customActiveTextColor,
						onColorChange: ( value ) => {
							setActiveTextColor( value );
							setAttributes( {
								customActiveTextColor: value,
							} );
						},
					},
					{
						label: __( 'Hover Background' ),
						colorValue:
							hoverBackgroundColor?.color ?? customHoverBackgroundColor,
						onColorChange: ( value ) => {
							setHoverBackgroundColor( value );
							setAttributes( {
								customHoverBackgroundColor: value,
							} );
						},
					},
					{
						label: __( 'Hover Text' ),
						colorValue:
							hoverTextColor?.color ?? customHoverTextColor,
						onColorChange: ( value ) => {
							setHoverTextColor( value );
							setAttributes( {
								customHoverTextColor: value,
							} );
						},
					},
				] }
				panelId={ clientId }
				disableCustomColors={ false }
				__experimentalIsRenderedInSidebar
				__next40pxDefaultSize
				{ ...colorSettings }
			/>
			<ContrastCheckerMatrix
				attributes={ attributes }
				activeBackgroundColor={ activeBackgroundColor }
				activeTextColor={ activeTextColor }
				hoverBackgroundColor={ hoverBackgroundColor }
				hoverTextColor={ hoverTextColor }
			/>
		</InspectorControls>
	);
}
