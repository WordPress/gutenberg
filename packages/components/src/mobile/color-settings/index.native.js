/**
 * External dependencies
 */
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	// useEffect,
	useContext,
	useRef,
	useCallback,
} from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	BottomSheetConsumer,
	ColorControl,
	PanelBody,
	BottomSheetContext,
} from '@wordpress/components';
import {
	useRoute,
	useFocusEffect,
	useNavigation,
} from '@react-navigation/native';
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

const BottomSheetScreen = ( { children, setHeight } ) => {
	const context = useContext( BottomSheetContext );
	const height = useRef( { maxHeight: 0 } );
	useFocusEffect(
		useCallback( () => {
			if ( height.current.maxHeight !== 0 ) {
				setHeight( height.current.maxHeight, context.snapToHeight );
			}
			return () => {};
		}, [] )
	);

	const onLayout = ( e ) => {
		if ( height.current.maxHeight !== e.nativeEvent.layout.height ) {
			height.current.maxHeight = e.nativeEvent.layout.height;
			setHeight( e.nativeEvent.layout.height, context.snapToHeight );
		}
	};
	return <View onLayout={ onLayout }>{ children }</View>;
};

const forFade = ( { current } ) => ( {
	cardStyle: {
		opacity: current.progress,
	},
} );
const Stack = createStackNavigator();

function ColorSettings( { defaultSettings } ) {
	const route = useRoute();
	const [ height, setHeightValue ] = useState( 1 );
	const setHeight = ( maxHeight ) => {
		if ( height !== maxHeight ) {
			setHeightValue( maxHeight );
		}
	};
	// useEffect( () => {
	// snapToHeight( 300 );
	// shouldDisableBottomSheetMaxHeight( true );
	// onCloseBottomSheet( null );
	// }, [] );

	// function afterHardwareButtonPress() {
	// 	onHardwareButtonPress( null );
	// 	shouldDisableBottomSheetMaxHeight( true );
	// }

	const PaletteScreenView = useRef( () => (
		<BottomSheetScreen setHeight={ setHeight }>
			<PaletteScreen />
		</BottomSheetScreen>
	) );

	const PickerScreenView = useRef( () => (
		<BottomSheetScreen setHeight={ setHeight }>
			<PickerScreen />
		</BottomSheetScreen>
	) );

	const GradientPickerView = useRef( () => (
		<BottomSheetScreen setHeight={ setHeight }>
			<GradientPickerScreen />
		</BottomSheetScreen>
	) );

	return (
		<View style={ { height } }>
			<Stack.Navigator
				screenOptions={ {
					headerShown: false,
					gestureEnabled: false,
				} }
			>
				<Stack.Screen
					name="Palette"
					component={ PaletteScreenView.current }
					options={ { cardStyleInterpolator: forFade } }
					initialParams={ { defaultSettings, ...route.params } }
				/>
				<Stack.Screen
					name="Picker"
					component={ PickerScreenView.current }
					options={ { cardStyleInterpolator: forFade } }
				/>
				<Stack.Screen
					name="GradientPicker"
					component={ GradientPickerView.current }
					options={ { cardStyleInterpolator: forFade } }
				/>
			</Stack.Navigator>
		</View>
	);
}

export default ColorSettings;

const PickerScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
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

const GradientPickerScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const { setColor, currentValue, isGradientColor } = route.params;
	return (
		<View>
			<NavigationHeader
				screen={ __( 'Customize Gradient' ) }
				leftButtonOnPress={ navigation.goBack }
			/>
			<CustomGradientPicker
				setColor={ setColor }
				currentValue={ currentValue }
				isGradientColor={ isGradientColor }
			/>
		</View>
	);
};

const PaletteScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
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
			onColorChange( '' );
		} else if ( ! isSolidSegment && onGradientChange ) {
			onGradientChange( color );
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
						onCustomPress={ onCustomPress }
						shouldEnableBottomSheetScroll={
							shouldEnableBottomSheetScroll
						}
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
			) }
		</BottomSheetConsumer>
	);
};
