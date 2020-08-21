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

	const { setHeight, setFullScreen } = useContext(
		BottomSheetNavigationContext
	);

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
			if ( fullScreen ) {
				setFullScreen( true );
				setIsFullScreen( true );
			} else if ( heightRef.current.maxHeight !== 0 ) {
				setHeight( heightRef.current.maxHeight );
			}
			return () => {
				if ( fullScreen ) {
					setIsFullScreen( false );
					setFullScreen( false );
				}
			};
		}, [ setFullScreen ] )
	);
	const onLayout = ( { nativeEvent } ) => {
		if ( fullScreen ) {
			return;
		}
		const { height } = nativeEvent.layout;
		setFullScreen( false );
		if ( heightRef.current.maxHeight !== height && isFocused ) {
			heightRef.current.maxHeight = height;
			setHeightDebounce( height, true );
		}
	};

	return useMemo( () => {
		return <View onLayout={ onLayout }>{ children }</View>;
	}, [ children, isFocused ] );
};

export default BottomSheetNavigationScreen;
