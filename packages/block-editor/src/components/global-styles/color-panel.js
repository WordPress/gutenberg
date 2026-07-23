/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getCSSValueFromRawStyle } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
import ColorGradientDropdownItem from './color-gradient-dropdown-item';
import {
	useColorsPerOrigin,
	useGradientsPerOrigin,
	useColorGradientSettings,
} from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { store as blockEditorStore } from '../../store';
import { getValueFromObjectPath, setImmutably } from '../../utils/object';
import {
	extractPresetSlug,
	encodeColorValueWithPalette,
} from '../../utils/color-values';
import { ENABLE_GLOBAL_STYLES_INHERITANCE } from './inheritance';

// Despite the "ColorPanel" name, this gates only the element-level color
// controls (link, heading, button, caption, h1–h6) — surfaced as the
// "Elements" panel in the block inspector and the "Colors" screen in
// Global Styles. Top-level text and background color moved to the
// Typography and Background panels, so this returns false for blocks
// whose only color support is text and/or background.
export function useHasColorPanel( settings ) {
	const hasLinkPanel = useHasLinkPanel( settings );
	const hasHeadingPanel = useHasHeadingPanel( settings );
	const hasButtonPanel = useHasButtonPanel( settings );
	const hasCaptionPanel = useHasCaptionPanel( settings );

	return hasLinkPanel || hasHeadingPanel || hasButtonPanel || hasCaptionPanel;
}

export function useHasTextPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.text &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasLinkPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.link &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasCaptionPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.caption &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasHeadingPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		settings?.color?.heading &&
		( colors?.length > 0 ||
			settings?.color?.custom ||
			gradients?.length > 0 ||
			settings?.color?.customGradient )
	);
}

export function useHasButtonPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		settings?.color?.button &&
		( colors?.length > 0 ||
			settings?.color?.custom ||
			gradients?.length > 0 ||
			settings?.color?.customGradient )
	);
}

export function useHasBackgroundColorPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		settings?.color?.background &&
		( colors?.length > 0 ||
			settings?.color?.custom ||
			gradients?.length > 0 ||
			settings?.color?.customGradient )
	);
}

export function ColorToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	label,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ label || __( 'Elements' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			hasInnerWrapper
			headingLevel={ 3 }
			className="color-block-support-panel"
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			<div className="color-block-support-panel__inner-wrapper">
				{ children }
			</div>
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	link: true,
	heading: true,
	button: true,
	caption: true,
};

// Maps an Elements panel `name` to the block it represents,
// so the theme.json restrictions can be looked up by name
const ELEMENT_BLOCK_NAME = {
	button: 'core/button',
	heading: 'core/heading',
	h1: 'core/heading',
	h2: 'core/heading',
	h3: 'core/heading',
	h4: 'core/heading',
	h5: 'core/heading',
	h6: 'core/heading',
};

function useThemeFeatures() {
	return useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings().__experimentalFeatures;
	}, [] );
}

export default function ColorPanel( {
	as: Wrapper = ColorToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	label,
	children,
	contrastWarning,
	showInheritanceLabelIndicators = ENABLE_GLOBAL_STYLES_INHERITANCE,
} ) {
	const {
		colors,
		gradients,
		areCustomSolidsEnabled,
		areCustomGradientsEnabled,
		hasSolidColors,
		hasGradientColors,
		allColors,
		decodeValue,
		encodeGradientValue,
	} = useColorGradientSettings( settings );

	// When an inherited preset isn't in the panel's palette, `decodeValue`
	// returns the raw `var:preset|…` token rather than a paintable colour.
	// Fall back to its CSS custom property so the swatch still renders.
	const decodeInheritedColor = ( rawValue ) =>
		getCSSValueFromRawStyle( decodeValue( rawValue ) );

	// Links
	const showLinkPanel = useHasLinkPanel( settings );
	const linkColor = decodeInheritedColor(
		inheritedValue?.elements?.link?.color?.text
	);
	const userLinkColor = decodeValue( value?.elements?.link?.color?.text );
	const setLinkColor = ( newColor, newSlug ) => {
		onChange(
			setImmutably(
				value,
				[ 'elements', 'link', 'color', 'text' ],
				encodeColorValueWithPalette( allColors, newColor, newSlug )
			)
		);
	};
	const hoverLinkColor = decodeInheritedColor(
		inheritedValue?.elements?.link?.[ ':hover' ]?.color?.text
	);
	const userHoverLinkColor = decodeValue(
		value?.elements?.link?.[ ':hover' ]?.color?.text
	);
	const setHoverLinkColor = ( newColor, newSlug ) => {
		onChange(
			setImmutably(
				value,
				[ 'elements', 'link', ':hover', 'color', 'text' ],
				encodeColorValueWithPalette( allColors, newColor, newSlug )
			)
		);
	};
	const hasLink = () => !! userLinkColor || !! userHoverLinkColor;
	const resetLink = () => {
		let newValue = setImmutably(
			value,
			[ 'elements', 'link', ':hover', 'color', 'text' ],
			undefined
		);
		newValue = setImmutably(
			newValue,
			[ 'elements', 'link', 'color', 'text' ],
			undefined
		);
		onChange( newValue );
	};

	const showCaptionPanel = useHasCaptionPanel( settings );
	const showButtonPanel = useHasButtonPanel( settings );
	const showHeadingPanel = useHasHeadingPanel( settings );

	const themeFeatures = useThemeFeatures();
	const getElementFeature = ( elementName, path ) => {
		const blockName = ELEMENT_BLOCK_NAME[ elementName ];
		if ( ! blockName ) {
			return false;
		}

		// Block based theme setting
		const blockValue = getValueFromObjectPath( themeFeatures, [
			'blocks',
			blockName,
			...path,
		] );
		if ( blockValue !== undefined ) {
			return blockValue;
		}

		// Global theme setting
		return getValueFromObjectPath( themeFeatures, path, true );
	};

	// Elements
	const elements = useMemo(
		() => [
			{
				name: 'caption',
				label: __( 'Captions' ),
				showPanel: showCaptionPanel,
			},
			{
				name: 'button',
				label: __( 'Button' ),
				showPanel: showButtonPanel,
			},
			{
				name: 'heading',
				label: __( 'Heading' ),
				showPanel: showHeadingPanel,
			},
			{
				name: 'h1',
				label: __( 'H1' ),
				showPanel: showHeadingPanel,
			},
			{
				name: 'h2',
				label: __( 'H2' ),
				showPanel: showHeadingPanel,
			},
			{
				name: 'h3',
				label: __( 'H3' ),
				showPanel: showHeadingPanel,
			},
			{
				name: 'h4',
				label: __( 'H4' ),
				showPanel: showHeadingPanel,
			},
			{
				name: 'h5',
				label: __( 'H5' ),
				showPanel: showHeadingPanel,
			},
			{
				name: 'h6',
				label: __( 'H6' ),
				showPanel: showHeadingPanel,
			},
		],
		[ showCaptionPanel, showButtonPanel, showHeadingPanel ]
	);

	const resetAllFilter = useCallback(
		( previousValue ) => {
			return {
				...previousValue,
				elements: {
					...previousValue?.elements,
					link: {
						...previousValue?.elements?.link,
						color: undefined,
						':hover': {
							color: undefined,
						},
					},
					...elements.reduce( ( acc, element ) => {
						return {
							...acc,
							[ element.name ]: {
								...previousValue?.elements?.[ element.name ],
								color: undefined,
							},
						};
					}, {} ),
				},
			};
		},
		[ elements ]
	);

	const items = [
		showLinkPanel && {
			key: 'link',
			label: __( 'Link' ),
			hasValue: hasLink,
			resetValue: resetLink,
			isShownByDefault: defaultControls.link,
			indicators: [
				userLinkColor ?? linkColor,
				userHoverLinkColor ?? hoverLinkColor,
			],
			isPlaceholder:
				userLinkColor === undefined &&
				userHoverLinkColor === undefined &&
				( linkColor !== undefined || hoverLinkColor !== undefined ),
			hasInheritedValue:
				linkColor !== undefined || hoverLinkColor !== undefined,
			contrastWarning,
			tabs: [
				{
					key: 'link',
					label: __( 'Default' ),
					inheritedValue: linkColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.elements?.link?.color?.text,
						'color'
					),
					userSlug: extractPresetSlug(
						value?.elements?.link?.color?.text,
						'color'
					),
					setValue: setLinkColor,
					userValue: userLinkColor,
					isPlaceholder:
						userLinkColor === undefined && linkColor !== undefined,
				},
				{
					key: 'hover',
					label: __( 'Hover' ),
					inheritedValue: hoverLinkColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.elements?.link?.[ ':hover' ]?.color
							?.text,
						'color'
					),
					userSlug: extractPresetSlug(
						value?.elements?.link?.[ ':hover' ]?.color?.text,
						'color'
					),
					setValue: setHoverLinkColor,
					userValue: userHoverLinkColor,
					isPlaceholder:
						userHoverLinkColor === undefined &&
						hoverLinkColor !== undefined,
				},
			],
		},
	].filter( Boolean );

	elements.forEach( ( { name, label: elementLabel, showPanel } ) => {
		if ( ! showPanel ) {
			return;
		}

		const elementBackgroundColor = decodeInheritedColor(
			inheritedValue?.elements?.[ name ]?.color?.background
		);
		const elementGradient = decodeInheritedColor(
			inheritedValue?.elements?.[ name ]?.color?.gradient
		);
		const elementTextColor = decodeInheritedColor(
			inheritedValue?.elements?.[ name ]?.color?.text
		);
		const elementBackgroundUserColor = decodeValue(
			value?.elements?.[ name ]?.color?.background
		);
		const elementGradientUserColor = decodeValue(
			value?.elements?.[ name ]?.color?.gradient
		);
		const elementTextUserColor = decodeValue(
			value?.elements?.[ name ]?.color?.text
		);
		const hasElement = () =>
			!! (
				elementTextUserColor ||
				elementBackgroundUserColor ||
				elementGradientUserColor
			);
		const resetElement = () => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'background' ],
				undefined
			);
			newValue.elements[ name ].color.gradient = undefined;
			newValue.elements[ name ].color.text = undefined;
			onChange( newValue );
		};

		const setElementTextColor = ( newTextColor, newSlug ) => {
			onChange(
				setImmutably(
					value,
					[ 'elements', name, 'color', 'text' ],
					encodeColorValueWithPalette(
						allColors,
						newTextColor,
						newSlug
					)
				)
			);
		};
		const setElementBackgroundColor = ( newBackgroundColor, newSlug ) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'background' ],
				encodeColorValueWithPalette(
					allColors,
					newBackgroundColor,
					newSlug
				)
			);
			newValue.elements[ name ].color.gradient = undefined;
			onChange( newValue );
		};
		const setElementGradient = ( newGradient, newSlug ) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'gradient' ],
				encodeGradientValue( newGradient, newSlug )
			);
			newValue.elements[ name ].color.background = undefined;
			onChange( newValue );
		};
		// Text, background, and gradient are not supported for `caption`.
		// For every other element, respect the corresponding block's theme.json
		// restrictions.
		const supportsText = getElementFeature( name, [ 'color', 'text' ] );
		const supportsBackground = getElementFeature( name, [
			'color',
			'background',
		] );
		const supportsGradient = getElementFeature( name, [
			'color',
			'customGradient',
		] );

		// Per-tab placeholder flags. The item-level placeholder is active when
		// there is no local color on any axis and at least one inherited color.
		const isElementTextPlaceholder =
			elementTextUserColor === undefined &&
			elementTextColor !== undefined;
		const isElementBackgroundPlaceholder =
			elementBackgroundUserColor === undefined &&
			elementBackgroundColor !== undefined;
		const isElementGradientPlaceholder =
			elementGradientUserColor === undefined &&
			elementGradient !== undefined;
		const isElementPlaceholder =
			elementTextUserColor === undefined &&
			elementBackgroundUserColor === undefined &&
			elementGradientUserColor === undefined &&
			( elementTextColor !== undefined ||
				elementBackgroundColor !== undefined ||
				elementGradient !== undefined );
		const hasElementInheritedValue =
			elementTextColor !== undefined ||
			elementBackgroundColor !== undefined ||
			elementGradient !== undefined;

		const tabs = [
			hasSolidColors &&
				supportsText && {
					key: 'text',
					label: __( 'Text' ),
					inheritedValue: elementTextColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.elements?.[ name ]?.color?.text,
						'color'
					),
					userSlug: extractPresetSlug(
						value?.elements?.[ name ]?.color?.text,
						'color'
					),
					setValue: setElementTextColor,
					userValue: elementTextUserColor,
					isPlaceholder: isElementTextPlaceholder,
				},
			hasSolidColors &&
				supportsBackground && {
					key: 'background',
					label: __( 'Background' ),
					inheritedValue: elementBackgroundColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.elements?.[ name ]?.color?.background,
						'color'
					),
					userSlug: extractPresetSlug(
						value?.elements?.[ name ]?.color?.background,
						'color'
					),
					setValue: setElementBackgroundColor,
					userValue: elementBackgroundUserColor,
					isPlaceholder: isElementBackgroundPlaceholder,
				},
			hasGradientColors &&
				supportsGradient && {
					key: 'gradient',
					label: __( 'Gradient' ),
					inheritedValue: elementGradient,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.elements?.[ name ]?.color?.gradient,
						'gradient'
					),
					userSlug: extractPresetSlug(
						value?.elements?.[ name ]?.color?.gradient,
						'gradient'
					),
					setValue: setElementGradient,
					userValue: elementGradientUserColor,
					isGradient: true,
					isPlaceholder: isElementGradientPlaceholder,
				},
		].filter( Boolean );

		// If nothing is configurable for this element, don't add it to the
		// panel at all
		if ( tabs.length === 0 ) {
			return;
		}

		const textIndicator = elementTextUserColor ?? elementTextColor;
		const backgroundIndicator =
			elementGradientUserColor ??
			elementGradient ??
			elementBackgroundUserColor ??
			elementBackgroundColor;
		const supportsBackgroundOrGradient =
			supportsBackground || supportsGradient;

		let indicators;
		if ( supportsText && supportsBackgroundOrGradient ) {
			indicators = [ textIndicator, backgroundIndicator ];
		} else if ( supportsBackgroundOrGradient ) {
			indicators = [ backgroundIndicator ];
		} else {
			indicators = [ textIndicator ];
		}

		items.push( {
			key: name,
			label: elementLabel,
			hasValue: hasElement,
			resetValue: resetElement,
			isShownByDefault: defaultControls[ name ],
			indicators,
			isPlaceholder: isElementPlaceholder,
			hasInheritedValue: hasElementInheritedValue,
			tabs,
		} );
	} );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			label={ label }
		>
			{ items.map( ( item ) => {
				const { key, ...restItem } = item;
				return (
					<ColorGradientDropdownItem
						key={ key }
						{ ...restItem }
						showInheritanceLabelIndicators={
							showInheritanceLabelIndicators
						}
						colorGradientControlSettings={ {
							colors,
							disableCustomColors: ! areCustomSolidsEnabled,
							gradients,
							disableCustomGradients: ! areCustomGradientsEnabled,
						} }
						panelId={ panelId }
					/>
				);
			} ) }
			{ children }
		</Wrapper>
	);
}
