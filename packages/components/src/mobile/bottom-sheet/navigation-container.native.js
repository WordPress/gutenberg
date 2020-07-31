/**
 * External dependencies
 */
import { View, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators } from '@react-navigation/stack';

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

const options = {
	transitionSpec: {
		open: AnimationSpec,
		close: AnimationSpec,
	},
	headerShown: false,
	gestureEnabled: false,
	cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

function BottomSheetNavigationContainer( {
	children,
	animate,
	main,
	theme,
	stack,
} ) {
	const context = useContext( BottomSheetContext );
	const [ height, setMaxHeight ] = useState( context.currentHeight || 1 );

	const setHeight = ( maxHeight, layout ) => {
		if ( height !== maxHeight && maxHeight > 1 ) {
			if ( animate && layout && height === 1 ) {
				setMaxHeight( maxHeight );
			} else if ( animate ) {
				// InteractionManager.runAfterInteractions( () => {
				performLayoutAnimation( 190 );
				setMaxHeight( maxHeight );
				// } );
			} else {
				setMaxHeight( maxHeight );
			}
		}
	};

	return (
		<View style={ { height } }>
			<BottomSheetProvider
				value={ { ...context, setHeight, currentHeight: height } }
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
