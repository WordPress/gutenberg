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
import {
	BottomSheetModal,
	BottomSheetModalProvider,
	BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

/**
 * WordPress dependencies
 */
import { BottomSheetContext } from '@wordpress/components';

import { useRef, useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BottomSheetNavigationContext } from './bottom-sheet-navigation-context';
import styles from './styles.scss';

const BottomSheetNavigationScreen = ( {
	children,
	fullScreen,
	isScrollable,
	isNested,
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
		}, [] )
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
		return isScrollable || isNested ? (
			<View onLayout={ onLayout }>{ children }</View>
		) : (
			<BottomSheetScrollView
				{ ...listProps }
				focusHook={ useFocusEffect }
			>
				<TouchableHighlight accessible={ false }>
					<View onLayout={ onLayout }>
						{ children }
						{ ! isNested && (
							<View
								style={ {
									height:
										safeAreaBottomInset ||
										styles.scrollableContent.paddingBottom,
								} }
							/>
						) }
					</View>
				</TouchableHighlight>
			</BottomSheetScrollView>
		);
	}, [ children, isFocused, safeAreaBottomInset, listProps ] );
};

export default BottomSheetNavigationScreen;
