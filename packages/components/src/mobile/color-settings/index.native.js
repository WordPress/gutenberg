/**
 * External dependencies
 */
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { BottomSheetConsumer } from '@wordpress/components';
import { useRoute } from '@react-navigation/native';
/**
 * Internal dependencies
 */
import ColorPicker from '../../color-picker';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SegmentedControls from '../segmented-control';
import { colorsUtils } from './utils';

import styles from './style.scss';

const forFade = ( { current } ) => ( {
	cardStyle: {
		opacity: current.progress,
	},
} );
const Stack = createStackNavigator();

function ColorSettings( { defaultSettings } ) {
	const route = useRoute();

	useEffect( () => {
		// shouldDisableBottomSheetMaxHeight( true );
		// onCloseBottomSheet( null );
	}, [] );

	// function afterHardwareButtonPress() {
	// 	onHardwareButtonPress( null );
	// 	shouldDisableBottomSheetMaxHeight( true );
	// }

	return (
		<View style={ { height: 250 } }>
			<Stack.Navigator
				screenOptions={ {
					headerShown: false,
					gestureEnabled: false,
				} }
			>
				<Stack.Screen
					name="Palette"
					component={ PaletteScreen }
					options={ { cardStyleInterpolator: forFade } }
					initialParams={ { defaultSettings, ...route.params } }
				/>
				<Stack.Screen
					name="Picker"
					component={ PickerScreen }
					options={ { cardStyleInterpolator: forFade } }
				/>
			</Stack.Navigator>
		</View>
	);
}

export default ColorSettings;

const PickerScreen = ( { route, navigation } ) => {
	const { setColor, currentValue, isGradientColor } = route.params;
	return (
		<BottomSheetConsumer>
			{ ( {
				shouldEnableBottomSheetScroll,
				shouldDisableBottomSheetMaxHeight,
				onCloseBottomSheet,
				isBottomSheetContentScrolling,
			} ) => (
				<ColorPicker
					shouldEnableBottomSheetScroll={
						shouldEnableBottomSheetScroll
					}
					shouldDisableBottomSheetMaxHeight={
						shouldDisableBottomSheetMaxHeight
					}
					setColor={ setColor }
					activeColor={ currentValue }
					isGradientColor={ isGradientColor }
					onNavigationBack={ navigation.goBack }
					onCloseBottomSheet={ onCloseBottomSheet }
					isBottomSheetContentScrolling={
						isBottomSheetContentScrolling
					}
				/>
			) }
		</BottomSheetConsumer>
	);
};

const PaletteScreen = ( { route, navigation } ) => {
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
	const setColor = ( color ) => {
		setCurrentValue( color );
		if ( isSolidSegment && onColorChange && onGradientChange ) {
			onColorChange( color );
			onGradientChange( '' );
		} else if ( isSolidSegment && onColorChange ) {
			onColorChange( color );
		} else if ( ! isSolidSegment && onGradientChange ) {
			onGradientChange( color );
		}
	};

	function getFooter() {
		if ( onGradientChange ) {
			return (
				<SegmentedControls
					segments={ segments }
					segmentHandler={ ( item ) => setCurrentSegment( item ) }
					selectedIndex={ selectedSegmentIndex }
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
		<BottomSheetConsumer>
			{ ( { shouldEnableBottomSheetScroll } ) => (
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
						onCustomPress={ () => {
							navigation.navigate( 'Picker', {
								setColor,
								isGradientColor,
								currentValue,
							} );
						} }
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
						defaultSettings={ defaultSettings }
					/>
					<View style={ horizontalSeparatorStyle } />
					{ getFooter() }
				</View>
			) }
		</BottomSheetConsumer>
	);
};
