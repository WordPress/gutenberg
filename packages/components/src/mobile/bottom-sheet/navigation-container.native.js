/**
 * External dependencies
 */
import { View } from 'react-native';

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
	const [ height, setMaxHeight ] = useState( 1 );

	const context = useContext( BottomSheetContext );
	const setHeight = ( maxHeight ) => {
		if ( height !== maxHeight && maxHeight > 50 ) {
			if ( animate ) {
				performLayoutAnimation( 300 );
			}
			setMaxHeight( maxHeight );
		}
	};

	return (
		<View style={ { height } }>
			<BottomSheetProvider value={ { ...context, setHeight } }>
				{ children }
			</BottomSheetProvider>
		</View>
	);
}

export default BottomSheetNavigationContainer;
