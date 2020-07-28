/**
 * External dependencies
 */
import { View, InteractionManager } from 'react-native';
/**
 * WordPress dependencies
 */
import { BottomSheetContext, BottomSheetProvider } from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { performLayoutAnimation } from '../layout-animation';

function BottomSheetNavigationContainer( { children, animate } ) {
	const context = useContext( BottomSheetContext );
	const [ height, setMaxHeight ] = useState( context.currentHeight || 1 );

	const setHeight = ( maxHeight ) => {
		if ( height !== maxHeight && maxHeight > 50 ) {
			if ( animate ) {
				InteractionManager.runAfterInteractions( () => {
					performLayoutAnimation();
					setMaxHeight( maxHeight );
				} );
			} else {
				setMaxHeight( maxHeight );
			}
		}
	};
	return (
		<View
			style={
				animate && context.currentHeight
					? { height: context.currentHeight }
					: { height }
			}
		>
			<BottomSheetProvider
				value={ { ...context, setHeight, currentHeight: height } }
			>
				{ children }
			</BottomSheetProvider>
		</View>
	);
}

export default BottomSheetNavigationContainer;
