/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Flex,
	FlexItem,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	Dropdown,
	Button,
	ColorIndicator,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { reset as resetIcon } from '@wordpress/icons';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';
import { setImmutably } from '../../utils/object';
import {
	useColorsPerOrigin,
	useGradientsPerOrigin,
} from '../global-styles/hooks';
import { unlock } from '../../lock-unlock';

const BACKGROUND_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
	className: 'block-editor-global-styles-background-panel__popover',
};

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

const LabeledColorIndicators = ( { indicators, label } ) => (
	<Item>
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
	</Item>
);

const { Tabs } = unlock( componentsPrivateApis );

/**
 * Checks if there is a current value in the background color block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background color value set.
 */
export function hasBackgroundColorValue( style ) {
	return (
		style?.background?.backgroundColor !== undefined ||
		style?.background?.backgroundGradient !== undefined
	);
}

export default function BackgroundColorControl( {
	value,
	onChange,
	inheritedValue = value,
	settings,
	label = __( 'Color' ),
} ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const backgroundGradient = decodeValue( inheritedValue?.color?.gradient );

	const userBackgroundColor = decodeValue( value?.color?.background );
	const userGradient = decodeValue( value?.color?.gradient );

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

	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;

	const tabs = [
		hasSolidColors && {
			key: 'background',
			label: __( 'Background' ),
			inheritedValue: backgroundColor,
			setValue: setBackgroundColor,
			userValue: userBackgroundColor,
		},
		hasGradientColors && {
			key: 'gradient',
			label: __( 'Gradient' ),
			inheritedValue: backgroundGradient,
			setValue: setGradient,
			userValue: userGradient,
			isGradient: true,
		},
	].filter( Boolean );

	const colorGradientControlSettings = {
		colors,
		disableCustomColors: ! areCustomSolidsEnabled,
		gradients,
		disableCustomGradients: ! areCustomGradientsEnabled,
	};

	const indicators = [ backgroundGradient ?? backgroundColor ];
	const currentTab = tabs.find( ( tab ) => tab.userValue !== undefined );
	const { key: firstTabKey, ...firstTab } = tabs[ 0 ] ?? {};

	const hasValue = userBackgroundColor || userGradient;
	const colorGradientDropdownButtonRef = useRef( undefined );

	const onReset = () => {
		onChange(
			setImmutably( value, [ 'color' ], {
				...value?.color,
				background: undefined,
				gradient: undefined,
			} )
		);
	};

	return (
		<Item className="block-editor-global-styles-background-panel__color-tools-panel-item">
			<Dropdown
				popoverProps={ BACKGROUND_POPOVER_PROPS }
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
						ref: colorGradientDropdownButtonRef,
					};

					return (
						<>
							<Button __next40pxDefaultSize { ...toggleProps }>
								<LabeledColorIndicators
									indicators={ indicators }
									label={ label }
								/>
							</Button>
							{ hasValue && (
								<Button
									__next40pxDefaultSize
									label={ __( 'Reset' ) }
									className="block-editor-global-styles-background-panel__color-reset"
									size="small"
									icon={ resetIcon }
									onClick={ () => {
										onReset();
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
		</Item>
	);
}
