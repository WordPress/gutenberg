/**
 * External dependencies
 */
import {
	useFocusEffect,
	useIsFocused,
	useNavigation,
} from '@react-navigation/native';
import { View } from 'react-native';

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
		onHardwareButtonPress,
		shouldDisableBottomSheetMaxHeight,
		setHeight,
	} = useContext( BottomSheetContext );
	useFocusEffect(
		useCallback( () => {
			onHardwareButtonPress( () => {
				if ( navigation.canGoBack() ) {
					shouldDisableBottomSheetMaxHeight( true );
					navigation.goBack();
					return true;
				}
				onHardwareButtonPress( null );
				return false;
			} );

			if ( heightRef.current.maxHeight !== 0 ) {
				setHeight( heightRef.current.maxHeight );
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
	cardStyleInterpolator: ( { current } ) => ( {
		cardStyle: {
			opacity: current.progress,
		},
	} ),
};

export default BottomSheetScreen;
