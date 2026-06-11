/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	ColorIndicator,
	Flex,
	FlexItem,
	Dropdown,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';
import { reset as resetIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { extractPresetSlug } from '../../utils/color-values';
import { unlock } from '../../lock-unlock';

export function useHasColorPanel( settings ) {
	const hasTextPanel = useHasTextPanel( settings );
	const hasBackgroundPanel = useHasBackgroundColorPanel( settings );
	const hasLinkPanel = useHasLinkPanel( settings );
	const hasHeadingPanel = useHasHeadingPanel( settings );
	const hasButtonPanel = useHasButtonPanel( settings );
	const hasCaptionPanel = useHasCaptionPanel( settings );

	return (
		hasTextPanel ||
		hasBackgroundPanel ||
		hasLinkPanel ||
		hasHeadingPanel ||
		hasButtonPanel ||
		hasCaptionPanel
	);
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

/**
 * Encodes a color value for storage in the style object.
 *
 * When a `slug` is provided it is used directly (slug-based selection path).
 * Otherwise the function falls back to looking up the hex value in the
 * palette; if found it encodes the slug, otherwise it stores the raw hex.
 *
 * Extracted to module scope so it is not re-created on every render.
 * Callers pass the flattened palette (`allColors`), computed once in `ColorPanel` from the per-origin `colors` array.
 *
 * @param {Array}       allColors  Flat array of `{ color, slug }` objects.
 * @param {string|void} colorValue Hex or CSS color string.
 * @param {string|void} slug       Optional palette slug from slug-aware selection.
 * @return {string|void} Encoded value suitable for the style object.
 */
function encodeColorValueWithPalette( allColors, colorValue, slug ) {
	if ( slug ) {
		return 'var:preset|color|' + slug;
	}
	const colorObject = allColors.find( ( { color } ) => color === colorValue );
	return colorObject ? 'var:preset|color|' + colorObject.slug : colorValue;
}

const DEFAULT_CONTROLS = {
	text: true,
	background: true,
	link: true,
	heading: true,
	button: true,
	caption: true,
};

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
};

const { Tabs } = unlock( componentsPrivateApis );

const LabeledColorIndicators = ( { indicators, label } ) => (
	<HStack justify="flex-start">
		<ZStack isLayered={ false } offset={ -8 }>
			{ indicators.map( ( indicator, index ) => (
				<Flex key={ index } expanded={ false }>
					<ColorIndicator colorValue={ indicator } />
				</Flex>
			) ) }
		</ZStack>
		<FlexItem className="block-editor-panel-color-gradient-settings__color-name">
			{ label }
		</FlexItem>
	</HStack>
);

function ColorPanelTab( {
	isGradient,
	inheritedValue,
	inheritedSlug,
	userValue,
	setValue,
	colorGradientControlSettings,
} ) {
	return (
		<ColorGradientControl
			{ ...colorGradientControlSettings }
			showTitle={ false }
			enableAlpha
			__experimentalIsRenderedInSidebar
			colorValue={ isGradient ? undefined : inheritedValue }
			colorSlug={ isGradient ? undefined : inheritedSlug }
			gradientValue={ isGradient ? inheritedValue : undefined }
			onColorChange={ isGradient ? undefined : setValue }
			onGradientChange={ isGradient ? setValue : undefined }
			clearable={ inheritedValue === userValue }
			headingLevel={ 3 }
		/>
	);
}

export function ColorPanelDropdown( {
	label,
	hasValue,
	resetValue,
	isShownByDefault,
	indicators,
	tabs,
	colorGradientControlSettings,
	panelId,
	className = 'block-editor-tools-panel-color-gradient-settings__item',
} ) {
	const currentTab = tabs.find( ( tab ) => tab.userValue !== undefined );
	const { key: firstTabKey, ...firstTab } = tabs[ 0 ] ?? {};
	const colorGradientDropdownButtonRef = useRef( undefined );
	return (
		<ToolsPanelItem
			className={ className }
			hasValue={ hasValue }
			label={ label }
			onDeselect={ resetValue }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<Dropdown
				popoverProps={ popoverProps }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const toggleProps = {
						onClick: onToggle,
						className: clsx(
							'block-editor-panel-color-gradient-settings__dropdown',
							{ 'is-open': isOpen }
						),
						'aria-expanded': isOpen,
						ref: colorGradientDropdownButtonRef,
					};

					return (
						<>
							<Button { ...toggleProps } __next40pxDefaultSize>
								<LabeledColorIndicators
									indicators={ indicators }
									label={ label }
								/>
							</Button>
							{ hasValue() && (
								<Button
									__next40pxDefaultSize
									label={ __( 'Reset' ) }
									className="block-editor-panel-color-gradient-settings__reset"
									size="small"
									icon={ resetIcon }
									onClick={ () => {
										resetValue();
										if ( isOpen ) {
											onToggle();
										}
										// Return focus to parent button
										colorGradientDropdownButtonRef.current?.focus();
									} }
								/>
							) }
						</>
					);
				} }
				renderContent={ () => (
					<DropdownContentWrapper paddingSize="none">
						<div className="block-editor-panel-color-gradient-settings__dropdown-content">
							{ tabs.length === 1 && (
								<ColorPanelTab
									key={ firstTabKey }
									{ ...firstTab }
									colorGradientControlSettings={
										colorGradientControlSettings
									}
								/>
							) }
							{ tabs.length > 1 && (
								<Tabs defaultTabId={ currentTab?.key }>
									<Tabs.TabList>
										{ tabs.map( ( tab ) => (
											<Tabs.Tab
												key={ tab.key }
												tabId={ tab.key }
											>
												{ tab.label }
											</Tabs.Tab>
										) ) }
									</Tabs.TabList>

									{ tabs.map( ( tab ) => {
										const { key: tabKey, ...restTabProps } =
											tab;
										return (
											<Tabs.TabPanel
												key={ tabKey }
												tabId={ tabKey }
												focusable={ false }
											>
												<ColorPanelTab
													key={ tabKey }
													{ ...restTabProps }
													colorGradientControlSettings={
														colorGradientControlSettings
													}
												/>
											</Tabs.TabPanel>
										);
									} ) }
								</Tabs>
							) }
						</div>
					</DropdownContentWrapper>
				) }
			/>
		</ToolsPanelItem>
	);
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
} ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;
	// When a block opts into background.gradient support, the gradient
	// picker moves to the Background panel. Hide it here to avoid
	// showing duplicate gradient controls.
	const hasBackgroundGradientSupport = !! settings?.background?.gradient;
	const showGradientColors =
		hasGradientColors && ! hasBackgroundGradientSupport;

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	const allColors = useMemo(
		() => colors.flatMap( ( { colors: originColors } ) => originColors ),
		[ colors ]
	);

	const encodeGradientValue = ( gradientValue ) => {
		const allGradients = gradients.flatMap(
			( { gradients: originGradients } ) => originGradients
		);
		const gradientObject = allGradients.find(
			( { gradient } ) => gradient === gradientValue
		);
		return gradientObject
			? 'var:preset|gradient|' + gradientObject.slug
			: gradientValue;
	};

	// BackgroundColor
	const showBackgroundPanel = useHasBackgroundColorPanel( settings );
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const gradient = decodeValue( inheritedValue?.color?.gradient );
	const userGradient = decodeValue( value?.color?.gradient );
	const hasBackground = () =>
		!! userBackgroundColor ||
		( ! hasBackgroundGradientSupport && !! userGradient );
	const setBackgroundColor = ( newColor, newSlug ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			encodeColorValueWithPalette( allColors, newColor, newSlug )
		);
		if ( ! hasBackgroundGradientSupport ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};
	const setGradient = ( newGradient ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue.color.background = undefined;
		onChange( newValue );
	};
	const resetBackground = () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		if ( ! hasBackgroundGradientSupport ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};

	// Links
	const showLinkPanel = useHasLinkPanel( settings );
	const linkColor = decodeValue(
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
	const hoverLinkColor = decodeValue(
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

	// Text Color
	const showTextPanel = useHasTextPanel( settings );
	const showCaptionPanel = useHasCaptionPanel( settings );
	const showButtonPanel = useHasButtonPanel( settings );
	const showHeadingPanel = useHasHeadingPanel( settings );
	const textColor = decodeValue( inheritedValue?.color?.text );
	const userTextColor = decodeValue( value?.color?.text );
	const hasTextColor = () => !! userTextColor;
	const setTextColor = ( newColor, newSlug ) => {
		let changedObject = setImmutably(
			value,
			[ 'color', 'text' ],
			encodeColorValueWithPalette( allColors, newColor, newSlug )
		);
		// Compare raw encoded references (e.g. `var:preset|color|slug`), not
		// decoded hex values. Two palette entries can share the same hex but
		// carry different slugs (e.g. `var:preset|color|dark-background` and
		// `var:preset|color|dark-text` both resolving to `#000`); comparing decoded
		// values would conflate them and incorrectly force the link color to
		// follow the text color even when the user deliberately chose a
		// different palette slot.
		//
		// Note: this is stricter than the previous decoded comparison.
		// If text and link were stored in different formats that resolved to
		// the same hex (e.g. one as `var:preset|color|x` and the other as
		// `var(--wp--preset--color--x)`), the old check would sync them
		// and this one will not. In practice this should not arise because
		// both values are written through the same encoding path.
		if (
			inheritedValue?.color?.text ===
			inheritedValue?.elements?.link?.color?.text
		) {
			changedObject = setImmutably(
				changedObject,
				[ 'elements', 'link', 'color', 'text' ],
				encodeColorValueWithPalette( allColors, newColor, newSlug )
			);
		}

		onChange( changedObject );
	};
	const resetTextColor = () => setTextColor( undefined );

	// Elements
	const elements = [
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
	];

	const resetAllFilter = ( previousValue ) => {
		return {
			...previousValue,
			color: undefined,
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
	};

	const items = [
		showTextPanel && {
			key: 'text',
			label: __( 'Text' ),
			hasValue: hasTextColor,
			resetValue: resetTextColor,
			isShownByDefault: defaultControls.text,
			indicators: [ textColor ],
			tabs: [
				{
					key: 'text',
					label: __( 'Text' ),
					inheritedValue: textColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.color?.text,
						'color'
					),
					setValue: setTextColor,
					userValue: userTextColor,
				},
			],
		},
		showBackgroundPanel && {
			key: 'background',
			label: __( 'Background' ),
			hasValue: hasBackground,
			resetValue: resetBackground,
			isShownByDefault: defaultControls.background,
			indicators: [
				( showGradientColors ? gradient : undefined ) ??
					backgroundColor,
			],
			tabs: [
				hasSolidColors && {
					key: 'background',
					label: __( 'Color' ),
					inheritedValue: backgroundColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.color?.background,
						'color'
					),
					setValue: setBackgroundColor,
					userValue: userBackgroundColor,
				},
				showGradientColors && {
					key: 'gradient',
					label: __( 'Gradient' ),
					inheritedValue: gradient,
					setValue: setGradient,
					userValue: userGradient,
					isGradient: true,
				},
			].filter( Boolean ),
		},
		showLinkPanel && {
			key: 'link',
			label: __( 'Link' ),
			hasValue: hasLink,
			resetValue: resetLink,
			isShownByDefault: defaultControls.link,
			indicators: [ linkColor, hoverLinkColor ],
			tabs: [
				{
					key: 'link',
					label: __( 'Default' ),
					inheritedValue: linkColor,
					inheritedSlug: extractPresetSlug(
						inheritedValue?.elements?.link?.color?.text,
						'color'
					),
					setValue: setLinkColor,
					userValue: userLinkColor,
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
					setValue: setHoverLinkColor,
					userValue: userHoverLinkColor,
				},
			],
		},
	].filter( Boolean );

	elements.forEach( ( { name, label: elementLabel, showPanel } ) => {
		if ( ! showPanel ) {
			return;
		}

		const elementBackgroundColor = decodeValue(
			inheritedValue?.elements?.[ name ]?.color?.background
		);
		const elementGradient = decodeValue(
			inheritedValue?.elements?.[ name ]?.color?.gradient
		);
		const elementTextColor = decodeValue(
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
		const setElementGradient = ( newGradient ) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'gradient' ],
				encodeGradientValue( newGradient )
			);
			newValue.elements[ name ].color.background = undefined;
			onChange( newValue );
		};
		const supportsTextColor = true;
		// Background color is not supported for `caption`
		// as there isn't yet a way to set padding for the element.
		const supportsBackground = name !== 'caption';

		items.push( {
			key: name,
			label: elementLabel,
			hasValue: hasElement,
			resetValue: resetElement,
			isShownByDefault: defaultControls[ name ],
			indicators:
				supportsTextColor && supportsBackground
					? [
							elementTextColor,
							elementGradient ?? elementBackgroundColor,
					  ]
					: [
							supportsTextColor
								? elementTextColor
								: elementGradient ?? elementBackgroundColor,
					  ],
			tabs: [
				hasSolidColors &&
					supportsTextColor && {
						key: 'text',
						label: __( 'Text' ),
						inheritedValue: elementTextColor,
						inheritedSlug: extractPresetSlug(
							inheritedValue?.elements?.[ name ]?.color?.text,
							'color'
						),
						setValue: setElementTextColor,
						userValue: elementTextUserColor,
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
						setValue: setElementBackgroundColor,
						userValue: elementBackgroundUserColor,
					},
				hasGradientColors &&
					supportsBackground && {
						key: 'gradient',
						label: __( 'Gradient' ),
						inheritedValue: elementGradient,
						setValue: setElementGradient,
						userValue: elementGradientUserColor,
						isGradient: true,
					},
			].filter( Boolean ),
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
					<ColorPanelDropdown
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
