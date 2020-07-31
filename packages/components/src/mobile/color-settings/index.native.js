/**
 * External dependencies
 */
import { createStackNavigator } from '@react-navigation/stack';

/**
 * WordPress dependencies
 */
import { useEffect, useContext } from '@wordpress/element';
import { BottomSheetContext, BottomSheet } from '@wordpress/components';
import { useRoute } from '@react-navigation/native';

/**
 * Internal dependencies
 */
import PickerScreen from './picker-screen';
import GradientPickerScreen from './gradient-picker-screen';
import PaletteScreen from './palette.screen';

import { colorsUtils } from './utils';

const Stack = createStackNavigator();

function ColorSettings( { defaultSettings } ) {
	const route = useRoute();
	const {
		onHandleClosingBottomSheet,
		shouldEnableBottomSheetMaxHeight,
	} = useContext( BottomSheetContext );

	useEffect( () => {
		shouldEnableBottomSheetMaxHeight( true );
		onHandleClosingBottomSheet( null );
	}, [] );

	return (
		<BottomSheet.NavigationContainer stack={ Stack }>
			{ BottomSheet.NavigationScreen( {
				name: colorsUtils.screens.palette,
				stack: Stack,
				initialParams: { defaultSettings, ...route.params },
				children: <PaletteScreen />,
			} ) }
			{ BottomSheet.NavigationScreen( {
				name: colorsUtils.screens.picker,
				stack: Stack,
				children: <PickerScreen />,
			} ) }
			{ BottomSheet.NavigationScreen( {
				name: colorsUtils.screens.gradientPicker,
				stack: Stack,
				children: <GradientPickerScreen />,
			} ) }
		</BottomSheet.NavigationContainer>
	);
}

export default ColorSettings;
