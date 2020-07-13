/**
 * External dependencies
 */
import {
	useFocusEffect,
	useIsFocused,
	useNavigation,
} from '@react-navigation/native';
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheetContext } from '@wordpress/components';

import { useRef, useCallback, useContext } from '@wordpress/element';

// TODO: Add Dimensions onChange listener to handle the orientation change and set correct full height
const fullHeightSize = Dimensions.get( 'window' ).height * 0.95;

const BottomSheetScreen = ( { children, fullHeight } ) => {
	const navigation = useNavigation();
	const height = useRef( { maxHeight: 0 } );
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
			if ( fullHeight ) {
				shouldDisableBottomSheetMaxHeight( false );
				setHeight( fullHeightSize );
			} else if ( height.current.maxHeight !== 0 ) {
				setHeight( height.current.maxHeight );
			}
			return () => {};
		}, [] )
	);

	const onLayout = ( e ) => {
		if ( ! fullHeight ) {
			if (
				height.current.maxHeight !== e.nativeEvent.layout.height &&
				isFocused
			) {
				height.current.maxHeight = e.nativeEvent.layout.height;
				setHeight( e.nativeEvent.layout.height );
			}
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
