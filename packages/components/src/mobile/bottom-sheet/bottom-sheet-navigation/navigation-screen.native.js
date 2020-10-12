/**
 * External dependencies
 */
import {
	useIsFocused,
	useNavigation,
	useFocusEffect,
} from '@react-navigation/native';
import { View, ScrollView, TouchableHighlight } from 'react-native';
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

const BottomSheetNavigationScreen = ( {
	children,
	fullScreen,
	isScrollable,
} ) => {
	const navigation = useNavigation();
	const heightRef = useRef( { maxHeight: 0 } );
	const isFocused = useIsFocused();
	const {
		onHandleHardwareButtonPress,
		shouldEnableBottomSheetMaxHeight,
		setIsFullScreen,
		listProps,
		safeAreaBottomInset,
	} = useContext( BottomSheetContext );

	const { setHeight } = useContext( BottomSheetNavigationContext );

	const setHeightDebounce = useCallback( debounce( setHeight, 10 ), [
		setHeight,
	] );

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
				setHeight( '100%' );
				setIsFullScreen( true );
			} else if ( heightRef.current.maxHeight !== 0 ) {
				setIsFullScreen( false );
				setHeight( heightRef.current.maxHeight );
			}
			return () => {};
		}, [ setHeight ] )
	);
	const onLayout = ( { nativeEvent } ) => {
		if ( fullScreen ) {
			return;
		}
		const { height } = nativeEvent.layout;

		if ( heightRef.current.maxHeight !== height && isFocused ) {
			heightRef.current.maxHeight = height;
			setHeightDebounce( height );
		}
	};

	return useMemo( () => {
		return isScrollable ? (
			<View onLayout={ onLayout }>{ children }</View>
		) : (
			<ScrollView { ...listProps }>
				<TouchableHighlight accessible={ false }>
					<View onLayout={ onLayout }>
						{ children }
						<View style={ { height: safeAreaBottomInset } } />
					</View>
				</TouchableHighlight>
			</ScrollView>
		);
	}, [ children, isFocused ] );
};

export default BottomSheetNavigationScreen;
