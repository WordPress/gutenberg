/**
 * External dependencies
 */
import { Animated, Easing } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheetContext, BottomSheetProvider } from '@wordpress/components';
import { useRef, useContext } from '@wordpress/element';

function BottomSheetNavigationContainer( { children, animate } ) {
	const heightValue = useRef( new Animated.Value( 1 ) ).current;
	const context = useContext( BottomSheetContext );
	const setHeight = ( maxHeight ) => {
		if ( heightValue !== maxHeight ) {
			if ( animate ) {
				Animated.timing( heightValue, {
					toValue: maxHeight,
					duration: 200,
					easing: Easing.ease,
				} ).start();
			} else {
				heightValue.setValue( maxHeight );
			}
		}
	};

	return (
		<Animated.View style={ { height: heightValue } }>
			<BottomSheetProvider value={ { ...context, setHeight } }>
				{ children }
			</BottomSheetProvider>
		</Animated.View>
	);
}

export default BottomSheetNavigationContainer;
