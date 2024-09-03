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
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { getValueFromVariable, useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import { unlock } from '../../lock-unlock';

export function useHasColorPanel( settings ) {
	const hasTextPanel = useHasTextPanel( settings );
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
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

export function useHasBackgroundPanel( settings ) {
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

function ColorToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Elements' ) }
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
		<FlexItem
			className="block-editor-panel-color-gradient-settings__color-name"
			title={ label }
		>
			{ label }
		</FlexItem>
	</HStack>
);

function ColorPanelTab( {
	isGradient,
	inheritedValue,
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
			gradientValue={ isGradient ? inheritedValue : undefined }
			onColorChange={ isGradient ? undefined : setValue }
			onGradientChange={ isGradient ? setValue : undefined }
			clearable={ inheritedValue === userValue }
			headingLevel={ 3 }
		/>
	);
}

function ColorPanelDropdown( {
	label,
	hasValue,
	resetValue,
	isShownByDefault,
	indicators,
	tabs,
	colorGradientControlSettings,
	panelId,
} ) {
	const currentTab = tabs.find( ( tab ) => tab.userValue !== undefined );
	const { key: firstTabKey, ...firstTab } = tabs[ 0 ] ?? {};
	return (
		<ToolsPanelItem
			className="block-editor-tools-panel-color-gradient-settings__item"
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
						'aria-label': sprintf(
							/* translators: %s is the type of color property, e.g., "background" */
							__( 'Color %s styles' ),
							label
						),
					};

					return (
						<Button
							// TODO: Switch to `true` (40px size) if possible
							__next40pxDefaultSize={ false }
							{ ...toggleProps }
						>
							<LabeledColorIndicators
								indicators={ indicators }
								label={ label }
							/>
						</Button>
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
	children,
} ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const encodeColorValue = ( colorValue ) => {
		const allColors = colors.flatMap(
			( { colors: originColors } ) => originColors
		);
		const colorObject = allColors.find(
			( { color } ) => color === colorValue
		);
		return colorObject
			? 'var:preset|color|' + colorObject.slug
			: colorValue;
	};
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
	const showBackgroundPanel = useHasBackgroundPanel( settings );
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const gradient = decodeValue( inheritedValue?.color?.gradient );
	const userGradient = decodeValue( value?.color?.gradient );
	const hasBackground = () => !! userBackgroundColor || !! userGradient;
	const setBackgroundColor = ( newColor ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			encodeColorValue( newColor )
		);
		newValue.color.gradient = undefined;
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
		newValue.color.gradient = undefined;
		onChange( newValue );
	};

	// Links
	const showLinkPanel = useHasLinkPanel( settings );
	const linkColor = decodeValue(
		inheritedValue?.elements?.link?.color?.text
	);
	const userLinkColor = decodeValue( value?.elements?.link?.color?.text );
	const setLinkColor = ( newColor ) => {
		onChange(
			setImmutably(
				value,
				[ 'elements', 'link', 'color', 'text' ],
				encodeColorValue( newColor )
			)
		);
	};
	const hoverLinkColor = decodeValue(
		inheritedValue?.elements?.link?.[ ':hover' ]?.color?.text
	);
	const userHoverLinkColor = decodeValue(
		value?.elements?.link?.[ ':hover' ]?.color?.text
	);
	const setHoverLinkColor = ( newColor ) => {
		onChange(
			setImmutably(
				value,
				[ 'elements', 'link', ':hover', 'color', 'text' ],
				encodeColorValue( newColor )
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
	const textColor = decodeValue( inheritedValue?.color?.text );
	const userTextColor = decodeValue( value?.color?.text );
	const hasTextColor = () => !! userTextColor;
	const setTextColor = ( newColor ) => {
		let changedObject = setImmutably(
			value,
			[ 'color', 'text' ],
			encodeColorValue( newColor )
		);
		if ( textColor === linkColor ) {
			changedObject = setImmutably(
				changedObject,
				[ 'elements', 'link', 'color', 'text' ],
				encodeColorValue( newColor )
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
			showPanel: useHasCaptionPanel( settings ),
		},
		{
			name: 'button',
			label: __( 'Button' ),
			showPanel: useHasButtonPanel( settings ),
		},
		{
			name: 'heading',
			label: __( 'Heading' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h1',
			label: __( 'H1' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h2',
			label: __( 'H2' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h3',
			label: __( 'H3' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h4',
			label: __( 'H4' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h5',
			label: __( 'H5' ),
			showPanel: useHasHeadingPanel( settings ),
		},
		{
			name: 'h6',
			label: __( 'H6' ),
			showPanel: useHasHeadingPanel( settings ),
		},
	];

	const resetAllFilter = useCallback( ( previousValue ) => {
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
	}, [] );

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
			indicators: [ gradient ?? backgroundColor ],
			tabs: [
				hasSolidColors && {
					key: 'background',
					label: __( 'Color' ),
					inheritedValue: backgroundColor,
					setValue: setBackgroundColor,
					userValue: userBackgroundColor,
				},
				hasGradientColors && {
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
					setValue: setLinkColor,
					userValue: userLinkColor,
				},
				{
					key: 'hover',
					label: __( 'Hover' ),
					inheritedValue: hoverLinkColor,
					setValue: setHoverLinkColor,
					userValue: userHoverLinkColor,
				},
			],
		},
	].filter( Boolean );

	elements.forEach( ( { name, label, showPanel } ) => {
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

		const setElementTextColor = ( newTextColor ) => {
			onChange(
				setImmutably(
					value,
					[ 'elements', name, 'color', 'text' ],
					encodeColorValue( newTextColor )
				)
			);
		};
		const setElementBackgroundColor = ( newBackgroundColor ) => {
			const newValue = setImmutably(
				value,
				[ 'elements', name, 'color', 'background' ],
				encodeColorValue( newBackgroundColor )
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
			label,
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
						setValue: setElementTextColor,
						userValue: elementTextUserColor,
					},
				hasSolidColors &&
					supportsBackground && {
						key: 'background',
						label: __( 'Background' ),
						inheritedValue: elementBackgroundColor,
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
