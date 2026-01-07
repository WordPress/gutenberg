/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	ContrastChecker,
	InspectorControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';

function ContrastCheckerMatrix( { attributes } ) {
	const {
		activeBackgroundColor,
		customActiveBackgroundColor,
		activeTextColor,
		customActiveTextColor,
		hoverBackgroundColor,
		customHoverBackgroundColor,
		hoverTextColor,
		customHoverTextColor,
		backgroundColor,
		textColor,
		fontSize,
	} = attributes;

	const activeBackground = useMemo( () => {
		if ( activeBackgroundColor?.color ) {
			return activeBackgroundColor.color;
		}
		return customActiveBackgroundColor;
	}, [ activeBackgroundColor, customActiveBackgroundColor ] );

	const activeText = useMemo( () => {
		if ( activeTextColor?.color ) {
			return activeTextColor.color;
		}
		return customActiveTextColor;
	}, [ activeTextColor, customActiveTextColor ] );

	const hoverBackground = useMemo( () => {
		if ( hoverBackgroundColor?.color ) {
			return hoverBackgroundColor.color;
		}
		return customHoverBackgroundColor;
	}, [ hoverBackgroundColor, customHoverBackgroundColor ] );

	const hoverText = useMemo( () => {
		if ( hoverTextColor?.color ) {
			return hoverTextColor.color;
		}
		return customHoverTextColor;
	}, [ hoverTextColor, customHoverTextColor ] );

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
		<>
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
				<ContrastCheckerMatrix attributes={ attributes } />
			</InspectorControls>
		</>
	);
}
