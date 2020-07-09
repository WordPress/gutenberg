/**
 * External dependencies
 */
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useContext, useRef } from '@wordpress/element';
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
	const [ heightValue, setHeightValue ] = useState( 1 );
	const {
		onCloseBottomSheet,
		shouldDisableBottomSheetMaxHeight,
	} = useContext( BottomSheetContext );
	const setHeight = ( maxHeight ) => {
		if ( heightValue !== maxHeight ) {
			setHeightValue( maxHeight );
		}
	};

	useEffect( () => {
		shouldDisableBottomSheetMaxHeight( true );
		onCloseBottomSheet( null );
	}, [] );

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
		<View style={ { height: heightValue } }>
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
		</View>
	);
}

export default ColorSettings;
