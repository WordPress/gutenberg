/**
 * External dependencies
 */
import { useRoute, useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { BottomSheetContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ColorPicker from '../../color-picker';

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

export default PickerScreen;
