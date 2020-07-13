/**
 * External dependencies
 */
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { useEffect, useContext, useRef } from '@wordpress/element';
import { BottomSheetContext, BottomSheet } from '@wordpress/components';
import { useRoute } from '@react-navigation/native';

/**
 * Internal dependencies
 */
import PickerScreen from './picker-screen';
import GradientPickerScreen from './gradient-picker-screen';
import PaletteScreen from './palette.screen';

const Stack = createStackNavigator();

function ColorSettings( { defaultSettings } ) {
	const route = useRoute();
	const {
		onCloseBottomSheet,
		shouldDisableBottomSheetMaxHeight,
	} = useContext( BottomSheetContext );

	useEffect( () => {
		shouldDisableBottomSheetMaxHeight( true );
		onCloseBottomSheet( null );
	}, [] );

	const PaletteScreenView = useRef( () => (
		<BottomSheet.NavigationScreen>
			<PaletteScreen />
		</BottomSheet.NavigationScreen>
	) );

	const PickerScreenView = useRef( () => (
		<BottomSheet.NavigationScreen>
			<PickerScreen />
		</BottomSheet.NavigationScreen>
	) );

	const GradientPickerView = useRef( () => (
		<BottomSheet.NavigationScreen>
			<GradientPickerScreen />
		</BottomSheet.NavigationScreen>
	) );

	return (
		<BottomSheet.NavigationContainer>
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
		</BottomSheet.NavigationContainer>
	);
}

export default ColorSettings;
