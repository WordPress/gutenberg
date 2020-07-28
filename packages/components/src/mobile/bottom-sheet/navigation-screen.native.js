/**
 * External dependencies
 */
import {
	useFocusEffect,
	useIsFocused,
	useNavigation,
} from '@react-navigation/native';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { View, InteractionManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheetContext } from '@wordpress/components';

import { useRef, useCallback, useContext } from '@wordpress/element';

const BottomSheetScreen = ( { children } ) => {
	const navigation = useNavigation();
	const heightRef = useRef( { maxHeight: 0 } );
	const isFocused = useIsFocused();
	const {
		onHandleHardwareButtonPress,
		shouldEnableBottomSheetMaxHeight,
		setHeight,
	} = useContext( BottomSheetContext );

	useFocusEffect(
		useCallback( () => {
			onHandleHardwareButtonPress( () => {
				if ( navigation.canGoBack() ) {
					shouldEnableBottomSheetMaxHeight( true );
					navigation.goBack();
					return true;
				}
				onHandleHardwareButtonPress( null );
				return false;
			} );

			if ( heightRef.current.maxHeight !== 0 ) {
				InteractionManager.runAfterInteractions( () => {
					setHeight( heightRef.current.maxHeight );
				} );
			}
			return () => {};
		}, [] )
	);
	const onLayout = ( { nativeEvent } ) => {
		const { height } = nativeEvent.layout;
		if ( heightRef.current.maxHeight !== height && isFocused ) {
			heightRef.current.maxHeight = height;
			setHeight( height );
		}
	};

	return <View onLayout={ onLayout }>{ children }</View>;
};

BottomSheetScreen.options = {
	cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

export default BottomSheetScreen;
