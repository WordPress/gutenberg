import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getCSSValueFromRawStyle } from '@wordpress/style-engine';
import ColorGradientDropdownItem from './color-gradient-dropdown-item';
import {
	useColorsPerOrigin,
	useGradientsPerOrigin,
	useColorGradientSettings,
} from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import {
	extractPresetSlug,
	encodeColorValueWithPalette,
} from '../../utils/color-values';
import type {
	ColorGradientDropdownItemProps,
	ColorGradientTabConfig,
	ColorPanelProps,
	PanelResetAllFilter,
	PanelStyle,
	StyleSettings,
	StyleToolsPanelProps,
	StyleValue,
} from './types';

// Despite the "ColorPanel" name, this gates only the element-level color
// controls (link, heading, button, caption, h1–h6) — surfaced as the
// "Elements" panel in the block inspector and the "Colors" screen in
// Global Styles. Top-level text and background color moved to the
// Typography and Background panels, so this returns false for blocks
// whose only color support is text and/or background.
export function useHasColorPanel( settings: StyleSettings | undefined ) {
	const hasLinkPanel = useHasLinkPanel( settings );
	const hasHeadingPanel = useHasHeadingPanel( settings );
	const hasButtonPanel = useHasButtonPanel( settings );
	const hasCaptionPanel = useHasCaptionPanel( settings );

	return hasLinkPanel || hasHeadingPanel || hasButtonPanel || hasCaptionPanel;
}

export function useHasTextPanel( settings: StyleSettings | undefined ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.text &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasLinkPanel( settings: StyleSettings | undefined ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.link &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasCaptionPanel( settings: StyleSettings | undefined ) {
	const colors = useColorsPerOrigin( settings );
	return (
		settings?.color?.caption &&
		( colors?.length > 0 || settings?.color?.custom )
	);
}

export function useHasHeadingPanel( settings: StyleSettings | undefined ) {
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

export function useHasButtonPanel( settings: StyleSettings | undefined ) {
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

export function useHasBackgroundColorPanel(
	settings: StyleSettings | undefined
) {
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
}: StyleToolsPanelProps ) {
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

const DEFAULT_CONTROLS: Record< string, boolean > = {
	link: true,
	heading: true,
	button: true,
	caption: true,
};

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
	additionalElements,
}: ColorPanelProps ) {
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
	const decodeInheritedColor = ( rawValue: StyleValue ) =>
		getCSSValueFromRawStyle( decodeValue( rawValue ) );

	// Links
	const showLinkPanel = useHasLinkPanel( settings );
	const linkColor = decodeInheritedColor(
		inheritedValue?.elements?.link?.color?.text
	);
	const userLinkColor = decodeValue( value?.elements?.link?.color?.text );
	const setLinkColor = ( newColor?: string, newSlug?: string ) => {
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
	const setHoverLinkColor = ( newColor?: string, newSlug?: string ) => {
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
			...( additionalElements?.map( ( element ) => ( {
				...element,
				showPanel: hasSolidColors || hasGradientColors,
			} ) ) ?? [] ),
		],
		[
			additionalElements,
			hasGradientColors,
			hasSolidColors,
			showCaptionPanel,
			showButtonPanel,
			showHeadingPanel,
		]
	);

	const resetAllFilter: PanelResetAllFilter = useCallback(
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
					...elements.reduce< Record< string, PanelStyle > >(
						( acc, element ) => {
							return {
								...acc,
								[ element.name ]: {
									...previousValue?.elements?.[
										element.name
									],
									color: undefined,
								},
							};
						},
						{}
					),
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
		// Hidden items are dropped.
	].filter( Boolean ) as ( Omit<
		ColorGradientDropdownItemProps,
		'colorGradientControlSettings'
	> & {
		key: string;
	} )[];

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
			// The element color was just set.
			newValue.elements![ name ].color!.gradient = undefined;
			newValue.elements![ name ].color!.text = undefined;
			onChange( newValue );
		};

		const setElementTextColor = (
			newTextColor?: string,
			newSlug?: string
		) => {
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
		const setElementBackgroundColor = (
			newBackgroundColor?: string,
			newSlug?: string
		) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'background' ],
				encodeColorValueWithPalette(
					allColors,
					newBackgroundColor,
					newSlug
				)
			);
			// The element color was just set.
			newValue.elements![ name ].color!.gradient = undefined;
			onChange( newValue );
		};
		const setElementGradient = (
			newGradient?: string,
			newSlug?: string
		) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'gradient' ],
				encodeGradientValue( newGradient, newSlug )
			);
			// The element color was just set.
			newValue.elements![ name ].color!.background = undefined;
			onChange( newValue );
		};
		// Background color is not supported for `caption`
		// as there isn't yet a way to set padding for the element.
		const supportsBackground = name !== 'caption';

		const isElementTextPlaceholder =
			elementTextUserColor === undefined &&
			elementTextColor !== undefined;
		const isElementBackgroundPlaceholder =
			elementBackgroundUserColor === undefined &&
			elementBackgroundColor !== undefined;
		const isElementGradientPlaceholder =
			elementGradientUserColor === undefined &&
			elementGradient !== undefined;

		items.push( {
			key: name,
			label: elementLabel,
			hasValue: hasElement,
			resetValue: resetElement,
			isShownByDefault: defaultControls[ name ],
			indicators: supportsBackground
				? [
						elementTextUserColor ?? elementTextColor,
						elementGradientUserColor ??
							elementGradient ??
							elementBackgroundUserColor ??
							elementBackgroundColor,
					]
				: [ elementTextUserColor ?? elementTextColor ],
			tabs: [
				hasSolidColors && {
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
							inheritedValue?.elements?.[ name ]?.color
								?.background,
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
					supportsBackground && {
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
				// Hidden tabs are dropped.
			].filter( Boolean ) as ColorGradientTabConfig[],
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
