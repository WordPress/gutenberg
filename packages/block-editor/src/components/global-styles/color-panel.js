/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	TabPanel,
	ColorIndicator,
	Flex,
	FlexItem,
	Dropdown,
	Button,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { getValueFromVariable } from './utils';

export function useHasColorPanel( settings ) {
	const hasTextPanel = useHasTextPanel( settings );
	const hasBackgroundPanel = useHasBackgroundPanel( settings );
	const hasLinkPanel = useHasLinkPanel( settings );

	return hasTextPanel || hasBackgroundPanel || hasLinkPanel;
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

export function useHasBackgroundPanel( settings ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	return (
		( settings?.color?.background &&
			( colors?.length > 0 || settings?.color?.custom ) ) ||
		( settings?.color?.gradient &&
			( gradients?.length > 0 || settings?.color?.customGradient ) )
	);
}

function ColorToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Color' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	text: true,
};

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
};

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
	const tabConfigs = tabs.map( ( { key, label: tabLabel } ) => {
		return {
			name: key,
			title: tabLabel,
		};
	} );

	return (
		<ToolsPanelItem
			hasValue={ hasValue }
			label={ label }
			onDeselect={ resetValue }
			isShownByDefault={ isShownByDefault }
			className="block-editor-tools-panel-color-gradient-settings__item"
			panelId={ panelId }
		>
			<Dropdown
				popoverProps={ popoverProps }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const toggleProps = {
						onClick: onToggle,
						className: classnames(
							'block-editor-panel-color-gradient-settings__dropdown',
							{ 'is-open': isOpen }
						),
						'aria-expanded': isOpen,
					};

					return (
						<Button { ...toggleProps }>
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
									{ ...tabs[ 0 ] }
									colorGradientControlSettings={
										colorGradientControlSettings
									}
								/>
							) }
							{ tabs.length > 1 && (
								<TabPanel tabs={ tabConfigs }>
									{ ( tab ) => {
										const selectedTab = tabs.find(
											( t ) => t.key === tab.name
										);

										if ( ! selectedTab ) {
											return null;
										}

										return (
											<ColorPanelTab
												{ ...selectedTab }
												colorGradientControlSettings={
													colorGradientControlSettings
												}
											/>
										);
									} }
								</TabPanel>
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

	// Text Color
	const showTextPanel = useHasTextPanel( settings );
	const textColor = decodeValue( inheritedValue?.color?.text );
	const userTextColor = decodeValue( value?.color?.text );
	const hasTextColor = () => !! userTextColor;
	const setTextColor = ( newColor ) => {
		onChange( {
			...value,
			color: { ...value?.color, text: encodeColorValue( newColor ) },
		} );
	};
	const resetTextColor = () => setTextColor( undefined );

	// BackgroundColor
	const showBackgroundPanel = useHasBackgroundPanel( settings );
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const gradient = decodeValue( inheritedValue?.color?.gradient );
	const userGradient = decodeValue( value?.color?.gradient );
	const hasBackground = () => !! userBackgroundColor || !! userGradient;
	const setBackgroundColor = ( newColor ) => {
		onChange( {
			...value,
			color: {
				...value?.color,
				background: encodeColorValue( newColor ),
				gradient: undefined,
			},
		} );
	};
	const setGradient = ( newGradient ) => {
		onChange( {
			...value,
			color: {
				...value?.color,
				background: undefined,
				gradient: encodeGradientValue( newGradient ),
			},
		} );
	};
	const resetBackground = () => {
		onChange( {
			...value,
			color: {
				...value?.color,
				background: undefined,
				gradient: undefined,
			},
		} );
	};

	// LinkColor
	const showLinkPanel = useHasLinkPanel( settings );
	const linkColor = decodeValue(
		inheritedValue?.elements?.link?.color?.text
	);
	const userLinkColor = decodeValue( value?.elements?.link?.color?.text );
	const hasLinkColor = () => !! userLinkColor;
	const setLinkColor = ( newColor ) => {
		onChange( {
			...value,
			elements: {
				...value?.color?.elements,
				link: {
					...value?.color?.elements?.link,
					color: {
						...value?.color?.elements?.link?.color,
						text: encodeColorValue( newColor ),
					},
				},
			},
		} );
	};
	const resetLinkColor = () => setLinkColor( undefined );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			color: undefined,
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
			indicators: [ backgroundColor ?? gradient ],
			tabs: [
				{
					key: 'background',
					label: __( 'Solid' ),
					inheritedValue: backgroundColor,
					setValue: setBackgroundColor,
					userValue: userBackgroundColor,
				},
				{
					key: 'gradient',
					label: __( 'Gradient' ),
					inheritedValue: gradient,
					setValue: setGradient,
					userValue: userGradient,
					isGradient: true,
				},
			],
		},
		showLinkPanel && {
			key: 'link',
			label: __( 'Link' ),
			hasValue: hasLinkColor,
			resetValue: resetLinkColor,
			isShownByDefault: defaultControls.link,
			indicators: [ linkColor ],
			tabs: [
				{
					key: 'link',
					label: __( 'Link' ),
					inheritedValue: linkColor,
					setValue: setLinkColor,
					userValue: userLinkColor,
				},
			],
		},
	].filter( Boolean );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ items.map( ( item ) => (
				<ColorPanelDropdown
					key={ item.key }
					{ ...item }
					colorGradientControlSettings={ {
						colors,
						disableCustomColors: ! areCustomSolidsEnabled,
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) ) }
			{ children }
		</Wrapper>
	);
}
