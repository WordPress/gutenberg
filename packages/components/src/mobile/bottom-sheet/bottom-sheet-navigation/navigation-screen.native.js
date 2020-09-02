/**
 * External dependencies
 */
import {
	useIsFocused,
	useNavigation,
	useFocusEffect,
} from '@react-navigation/native';
import { View, Keyboard } from 'react-native';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { BottomSheetContext } from '@wordpress/components';

import { useRef, useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BottomSheetNavigationContext } from './bottom-sheet-navigation-context';

const BottomSheetNavigationScreen = ( { children, fullScreen } ) => {
	const navigation = useNavigation();
	const heightRef = useRef( { maxHeight: 0 } );
	const isFocused = useIsFocused();
	const {
		onHandleHardwareButtonPress,
		shouldEnableBottomSheetMaxHeight,
		setIsFullScreen,
	} = useContext( BottomSheetContext );

	const { setHeight, setNavigationFullScreen } = useContext(
		BottomSheetNavigationContext
	);

	const setHeightDebounce = useCallback(
		debounce( ( height ) => {
			setHeight( height, true );
			setNavigationFullScreen( false );
		}, 10 ),
		[ setNavigationFullScreen, setHeight ]
	);

	const setFullHeight = useCallback(
		( isFull ) => {
			setIsFullScreen( isFull );
			setNavigationFullScreen( isFull );
		},
		[ setNavigationFullScreen, setIsFullScreen ]
	);

	useFocusEffect(
		useCallback( () => {
			onHandleHardwareButtonPress( () => {
				if ( navigation.canGoBack() ) {
					Keyboard.dismiss();
					shouldEnableBottomSheetMaxHeight( true );
					navigation.goBack();
					return true;
				}
				onHandleHardwareButtonPress( null );
				return false;
			} );
			if ( fullScreen ) {
				setFullHeight( true );
			} else if ( heightRef.current.maxHeight !== 0 ) {
				setHeight( heightRef.current.maxHeight );
				setFullHeight( false );
			}
			return () => {};
		}, [ setFullHeight ] )
	);
	const onLayout = ( { nativeEvent } ) => {
		if ( fullScreen ) {
			return;
		}
		const { height } = nativeEvent.layout;

		if ( heightRef.current.maxHeight !== height && isFocused ) {
			heightRef.current.maxHeight = height;
			if ( fullScreen ) {
				return;
			}
			setHeightDebounce( height );
		}
	};

	return useMemo( () => {
		return <View onLayout={ onLayout }>{ children }</View>;
	}, [ children, isFocused ] );
};

export default BottomSheetNavigationScreen;
