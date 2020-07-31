/**
 * External dependencies
 */
import {
	useFocusEffect,
	useIsFocused,
	useNavigation,
} from '@react-navigation/native';
import { View } from 'react-native';
import { debounce } from 'lodash';

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

	const setHeightDebounce = useCallback( debounce( setHeight, 10 ), [] );

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
				// InteractionManager.runAfterInteractions( () => {
				setHeight( heightRef.current.maxHeight );
				// } );
			}
			return () => {};
		}, [] )
	);
	const onLayout = ( { nativeEvent } ) => {
		const { height } = nativeEvent.layout;
		if ( heightRef.current.maxHeight !== height && isFocused ) {
			heightRef.current.maxHeight = height;
			setHeightDebounce( height, true );
		}
	};

	return <View onLayout={ onLayout }>{ children }</View>;
};

const OuterBottomSheetScreen = ( { name, stack, children, ...otherProps } ) => {
	const ScreenView = useRef( () => (
		<BottomSheetScreen>{ children }</BottomSheetScreen>
	) );
	return (
		<stack.Screen
			name={ name }
			component={ ScreenView.current }
			{ ...otherProps }
		/>
	);
};

export default OuterBottomSheetScreen;
