/**
 * External dependencies
 */
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */

import { useRef, useCallback } from '@wordpress/element';

const BottomSheetScreen = ( { children, setHeight } ) => {
	const height = useRef( { maxHeight: 0 } );
	const isFocused = useIsFocused();
	useFocusEffect(
		useCallback( () => {
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
