/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, PanelBody } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import {
	ContrastChecker,
	InspectorControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';

function ContrastCheckerMatrix( { attributes } ) {
	const {
		className,
		fontSize,
		tabActiveColor,
		customTabActiveColor,
		tabActiveTextColor,
		customTabActiveTextColor,
		tabInactiveColor,
		customTabInactiveColor,
		tabTextColor,
		customTabTextColor,
		tabHoverColor,
		customTabHoverColor,
		tabHoverTextColor,
		customTabHoverTextColor,
	} = attributes;

	const activeBackground = useMemo( () => {
		if ( className?.includes( 'is-style-links' ) ) {
			return '#fff';
		}
		if ( tabActiveColor?.color ) {
			return tabActiveColor.color;
		}
		return customTabActiveColor;
	}, [ tabActiveColor, customTabActiveColor, className ] );

	const activeText = useMemo( () => {
		if ( tabActiveTextColor?.color ) {
			return tabActiveTextColor.color;
		}
		return customTabActiveTextColor;
	}, [ tabActiveTextColor, customTabActiveTextColor ] );

	const inactiveBackground = useMemo( () => {
		if ( className?.includes( 'is-style-links' ) ) {
			return '#fff';
		}
		if ( tabInactiveColor?.color ) {
			return tabInactiveColor.color;
		}
		return customTabInactiveColor;
	}, [ tabInactiveColor, customTabInactiveColor, className ] );

	const inactiveText = useMemo( () => {
		if ( tabTextColor?.color ) {
			return tabTextColor.color;
		}
		return customTabTextColor;
	}, [ tabTextColor, customTabTextColor ] );

	const hoverBackground = useMemo( () => {
		if ( tabHoverColor?.color ) {
			return tabHoverColor.color;
		}
		return customTabHoverColor;
	}, [ tabHoverColor, customTabHoverColor ] );

	const hoverText = useMemo( () => {
		if ( tabHoverTextColor?.color ) {
			return tabHoverTextColor.color;
		}
		return customTabHoverTextColor;
	}, [ tabHoverTextColor, customTabHoverTextColor ] );

	return (
		<>
			<ContrastChecker
				backgroundColor={ activeBackground }
				fontSize={ fontSize }
				textColor={ activeText }
			/>
			<ContrastChecker
				backgroundColor={ inactiveBackground }
				fontSize={ fontSize }
				textColor={ inactiveText }
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
	tabInactiveColor,
	setTabInactiveColor,
	tabHoverColor,
	setTabHoverColor,
	tabActiveColor,
	setTabActiveColor,
	tabTextColor,
	setTabTextColor,
	tabActiveTextColor,
	setTabActiveTextColor,
	tabHoverTextColor,
	setTabHoverTextColor,
} ) {
	const {
		customTabInactiveColor,
		customTabActiveColor,
		customTabHoverColor,
		customTabTextColor,
		customTabActiveTextColor,
		customTabHoverTextColor,
		orientation,
	} = attributes;
	/**
	 * Get the color settings for the block.
	 */
	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Tabs Settings' ) }>
					<ToggleControl
						label="Vertical Tabs"
						checked={ 'vertical' === orientation }
						onChange={ () =>
							setAttributes( {
								orientation:
									'vertical' === orientation
										? 'horizontal'
										: 'vertical',
							} )
						}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					settings={ [
						{
							label: __( 'Tab Active Background' ),
							colorValue:
								tabActiveColor?.color ?? customTabActiveColor,
							onColorChange: ( value ) => {
								setTabActiveColor( value );
								setAttributes( {
									customTabActiveColor: value,
								} );
							},
						},
						{
							label: __( 'Tab Active Text' ),
							colorValue:
								tabActiveTextColor?.color ??
								customTabActiveTextColor,
							onColorChange: ( value ) => {
								setTabActiveTextColor( value );
								setAttributes( {
									customTabActiveTextColor: value,
								} );
							},
						},
						{
							label: __( 'Tab Inactive Background' ),
							colorValue:
								tabInactiveColor?.color ??
								customTabInactiveColor,
							onColorChange: ( value ) => {
								setTabInactiveColor( value );
								setAttributes( {
									customTabInactiveColor: value,
								} );
							},
						},
						{
							label: __( 'Tab Inactive Text' ),
							colorValue:
								tabTextColor?.color ?? customTabTextColor,
							onColorChange: ( value ) => {
								setTabTextColor( value );
								setAttributes( {
									customTabTextColor: value,
								} );
							},
						},
						{
							label: __( 'Tab Hover Background' ),
							colorValue:
								tabHoverColor?.color ?? customTabHoverColor,
							onColorChange: ( value ) => {
								setTabHoverColor( value );
								setAttributes( {
									customTabHoverColor: value,
								} );
							},
						},
						{
							label: __( 'Tab Hover Text' ),
							colorValue:
								tabHoverTextColor?.color ??
								customTabHoverTextColor,
							onColorChange: ( value ) => {
								setTabHoverTextColor( value );
								setAttributes( {
									customTabHoverTextColor: value,
								} );
							},
						},
					] }
					panelId={ clientId }
					disableCustomColors={ false }
					__experimentalIsRenderedInSidebar
					{ ...colorSettings }
				/>
				<ContrastCheckerMatrix attributes={ attributes } />
			</InspectorControls>
		</>
	);
}
