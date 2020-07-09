/**
 * External dependencies
 */
import { View, Text, Animated } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useContext, useRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	ColorControl,
	PanelBody,
	BottomSheetContext,
	BottomSheet,
} from '@wordpress/components';
import { useRoute, useNavigation } from '@react-navigation/native';
/**
 * Internal dependencies
 */
import ColorPicker from '../../color-picker';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import CustomGradientPicker from '../../custom-gradient-picker';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SegmentedControls from '../segmented-control';
import { colorsUtils } from './utils';

import styles from './style.scss';

const Stack = createStackNavigator();

function ColorSettings( { defaultSettings } ) {
	const route = useRoute();
	const heightValue = useRef( new Animated.Value( 1 ) ).current;
	const {
		onCloseBottomSheet,
		shouldDisableBottomSheetMaxHeight,
	} = useContext( BottomSheetContext );
	const setHeight = ( maxHeight ) => {
		if ( heightValue !== maxHeight ) {
			heightValue.setValue( maxHeight );
		}
	};

	useEffect( () => {
		shouldDisableBottomSheetMaxHeight( true );
		onCloseBottomSheet( null );
	}, [] );

	// function afterHardwareButtonPress() {
	// onHardwareButtonPress( null );
	// shouldDisableBottomSheetMaxHeight( true );
	// }

	const PaletteScreenView = useRef( () => (
		<BottomSheet.NavigationScreen setHeight={ setHeight } name={ 'palete' }>
			<PaletteScreen />
		</BottomSheet.NavigationScreen>
	) );

	const PickerScreenView = useRef( () => (
		<BottomSheet.NavigationScreen setHeight={ setHeight } name={ 'Picker' }>
			<PickerScreen />
		</BottomSheet.NavigationScreen>
	) );

	const GradientPickerView = useRef( () => (
		<BottomSheet.NavigationScreen
			setHeight={ setHeight }
			name={ 'Gradient' }
		>
			<GradientPickerScreen />
		</BottomSheet.NavigationScreen>
	) );

	return (
		<Animated.View style={ { height: heightValue } }>
			<Stack.Navigator
				screenOptions={ {
					headerShown: false,
					gestureEnabled: false,
				} }
			>
				<Stack.Screen
					name="Palette"
					component={ PaletteScreenView.current }
					options={ BottomSheet.NavigationScreen.options }
					initialParams={ { defaultSettings, ...route.params } }
				/>
				<Stack.Screen
					name="Picker"
					component={ PickerScreenView.current }
					options={ BottomSheet.NavigationScreen.options }
				/>
				<Stack.Screen
					name="GradientPicker"
					component={ GradientPickerView.current }
					options={ BottomSheet.NavigationScreen.options }
				/>
			</Stack.Navigator>
		</Animated.View>
	);
}

export default ColorSettings;

const PickerScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const {
		onShouldEnableInnerHandling,
		shouldDisableBottomSheetMaxHeight,
		onCloseBottomSheet,
		isBottomSheetContentScrolling,
		shouldEnableBottomSheetScroll,
	} = useContext( BottomSheetContext );
	const { setColor, currentValue, isGradientColor } = route.params;
	return (
		<ColorPicker
			onShouldEnableInnerHandling={ onShouldEnableInnerHandling }
			shouldDisableBottomSheetMaxHeight={
				shouldDisableBottomSheetMaxHeight
			}
			setColor={ setColor }
			activeColor={ currentValue }
			isGradientColor={ isGradientColor }
			onNavigationBack={ navigation.goBack }
			onCloseBottomSheet={ onCloseBottomSheet }
			isBottomSheetContentScrolling={ isBottomSheetContentScrolling }
			shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
		/>
	);
};

const GradientPickerScreen = () => {
	const navigation = useNavigation();
	return (
		<View>
			<NavigationHeader
				screen={ __( 'Customize Gradient' ) }
				leftButtonOnPress={ navigation.goBack }
			/>
			<CustomGradientPicker />
		</View>
	);
};

const PaletteScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const { shouldEnableBottomSheetScroll } = useContext( BottomSheetContext );
	const {
		label,
		onColorChange,
		onGradientChange,
		colorValue,
		defaultSettings,
	} = route.params || {};
	const { segments, isGradient } = colorsUtils;

	const [ currentValue, setCurrentValue ] = useState( colorValue );
	const isGradientColor = isGradient( currentValue );
	const selectedSegmentIndex = isGradientColor ? 1 : 0;

	const [ currentSegment, setCurrentSegment ] = useState(
		segments[ selectedSegmentIndex ]
	);

	const horizontalSeparatorStyle = usePreferredColorSchemeStyle(
		styles.horizontalSeparator,
		styles.horizontalSeparatorDark
	);

	const isSolidSegment = currentSegment === segments[ 0 ];
	const isCustomGadientShown = ! isSolidSegment && isGradientColor;

	const setColor = ( color ) => {
		setCurrentValue( color );
		if ( isSolidSegment && onColorChange && onGradientChange ) {
			onColorChange( color );
			onGradientChange( '' );
		} else if ( isSolidSegment && onColorChange ) {
			onColorChange( color );
		} else if ( ! isSolidSegment && onGradientChange ) {
			onGradientChange( color );
			onColorChange( '' );
		}
	};

	function onCustomPress() {
		if ( isSolidSegment ) {
			navigation.navigate( 'Picker', {
				setColor,
				isGradientColor,
				currentValue,
			} );
		} else {
			navigation.navigate( 'GradientPicker', {
				setColor,
				isGradientColor,
				currentValue,
				isSolidSegment,
			} );
		}
	}

	function getFooter() {
		if ( onGradientChange ) {
			return (
				<SegmentedControls
					segments={ segments }
					segmentHandler={ setCurrentSegment }
					selectedIndex={ segments.indexOf( currentSegment ) }
					addonLeft={
						currentValue && (
							<ColorIndicator
								color={ currentValue }
								style={ styles.colorIndicator }
							/>
						)
					}
				/>
			);
		}
		return (
			<View style={ styles.footer }>
				<View style={ styles.flex }>
					{ currentValue && (
						<ColorIndicator
							color={ currentValue }
							style={ styles.colorIndicator }
						/>
					) }
				</View>
				<Text
					style={ styles.selectColorText }
					maxFontSizeMultiplier={ 2 }
				>
					{ __( 'Select a color' ) }
				</Text>
				<View style={ styles.flex } />
			</View>
		);
	}

	return (
		<View>
			<NavigationHeader
				screen={ label }
				leftButtonOnPress={ navigation.goBack }
			/>
			<ColorPalette
				setColor={ setColor }
				activeColor={ currentValue }
				isGradientColor={ isGradientColor }
				currentSegment={ currentSegment }
				onCustomPress={ onCustomPress }
				shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
				defaultSettings={ defaultSettings }
			/>
			{ isCustomGadientShown && (
				<>
					<View style={ horizontalSeparatorStyle } />
					<PanelBody>
						<ColorControl
							label={ __( 'Customize Gradient' ) }
							onPress={ onCustomPress }
							withColorIndicator={ false }
						/>
					</PanelBody>
				</>
			) }
			<View style={ horizontalSeparatorStyle } />
			{ getFooter() }
		</View>
	);
};
