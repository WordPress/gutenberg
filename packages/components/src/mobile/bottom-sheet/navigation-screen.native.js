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

const BottomSheetScreen = ( { children, setHeight } ) => {
	const navigation = useNavigation();
	const height = useRef( { maxHeight: 0 } );
	const isFocused = useIsFocused();
	const { onHardwareButtonPress } = useContext( BottomSheetContext );
	useFocusEffect(
		useCallback( () => {
			onHardwareButtonPress( () => {
				if ( navigation.canGoBack() ) {
					navigation.goBack();
					return true;
				}
				onHardwareButtonPress( null );
				return false;
			} );

			if ( height.current.maxHeight !== 0 ) {
				setHeight( height.current.maxHeight );
			}
			return () => {};
		}, [] )
	);

	const onLayout = ( e ) => {
		if (
			height.current.maxHeight !== e.nativeEvent.layout.height &&
			isFocused
		) {
			height.current.maxHeight = e.nativeEvent.layout.height;
			setHeight( e.nativeEvent.layout.height );
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
