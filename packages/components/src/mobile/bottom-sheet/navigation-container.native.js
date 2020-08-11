/**
 * External dependencies
 */
import { View, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { BottomSheetContext, BottomSheetProvider } from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { performLayoutAnimation } from '../layout-animation';

const AnimationSpec = {
	animation: 'timing',
	config: {
		duration: 200,
		easing: Easing.ease,
	},
};

const fadeConfig = ( { current } ) => {
	return {
		cardStyle: {
			opacity: current.progress,
		},
	};
};

const options = {
	transitionSpec: {
		open: AnimationSpec,
		close: AnimationSpec,
	},
	headerShown: false,
	gestureEnabled: false,
	cardStyleInterpolator: fadeConfig,
};

const ANIMATION_DURATION = 190;

function BottomSheetNavigationContainer( {
	children,
	animate,
	main,
	theme,
	stack,
} ) {
	const context = useContext( BottomSheetContext );
	const [ currentHeight, setCurrentHeight ] = useState( context.currentHeight || 1 );

	const setHeight = ( height, layout ) => {
		if ( currentHeight !== height && height > 1 ) {
			if ( animate && layout && currentHeight === 1 ) {
				setCurrentHeight( height );
			} else if ( animate ) {
				performLayoutAnimation( ANIMATION_DURATION );
				setCurrentHeight( height );
			} else {
				setCurrentHeight( height );
			}
		}
	};

	return (
		<View style={ { height: currentHeight } }>
			<BottomSheetProvider
				value={ { ...context, setHeight, currentHeight } }
			>
				{ main ? (
					<NavigationContainer theme={ theme }>
						<stack.Navigator screenOptions={ options }>
							{ children }
						</stack.Navigator>
					</NavigationContainer>
				) : (
					<stack.Navigator screenOptions={ options }>
						{ children }
					</stack.Navigator>
				) }
			</BottomSheetProvider>
		</View>
	);
}

export default BottomSheetNavigationContainer;
