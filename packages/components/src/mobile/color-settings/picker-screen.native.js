/**
 * External dependencies
 */
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorPicker } from '../../color-picker';
import { BottomSheetContext } from '../bottom-sheet/bottom-sheet-context';

const PickerScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const {
		onShouldEnableInnerHandling,
		shouldEnableBottomSheetMaxHeight,
		onHandleClosingBottomSheet,
		isBottomSheetContentScrolling,
		shouldEnableBottomSheetScroll,
		onHandleHardwareButtonPress,
	} = useContext( BottomSheetContext );
	const { setColor, currentValue, isGradientColor } = route.params;
	return useMemo( () => {
		return (
			<ColorPicker
				onShouldEnableInnerHandling={ onShouldEnableInnerHandling }
				shouldEnableBottomSheetMaxHeight={
					shouldEnableBottomSheetMaxHeight
				}
				setColor={ setColor }
				activeColor={ currentValue }
				isGradientColor={ isGradientColor }
				onNavigationBack={ navigation.goBack }
				onHandleClosingBottomSheet={ onHandleClosingBottomSheet }
				isBottomSheetContentScrolling={ isBottomSheetContentScrolling }
				shouldEnableBottomSheetScroll={ shouldEnableBottomSheetScroll }
				onHandleHardwareButtonPress={ onHandleHardwareButtonPress }
			/>
		);
		// See https://github.com/WordPress/gutenberg/pull/41166
	}, [
		setColor,
		currentValue,
		isGradientColor,
		onShouldEnableInnerHandling,
		shouldEnableBottomSheetMaxHeight,
		onHandleClosingBottomSheet,
		isBottomSheetContentScrolling,
		shouldEnableBottomSheetScroll,
		onHandleHardwareButtonPress,
	] );
};

export default PickerScreen;
