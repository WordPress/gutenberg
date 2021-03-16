/**
 * External dependencies
 */
import { SafeAreaView } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children, useEffect, useContext } from '@wordpress/element';
import { createSlotFill, BottomSheetContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { BottomSheetNavigationContext } from '../bottom-sheet-navigation/bottom-sheet-navigation-context';

const { Fill, Slot } = createSlotFill( 'BottomSheetSubSheet' );

const BottomSheetSubSheet = ( {
	children,
	navigationButton,
	showSheet,
	isFullScreen,
} ) => {
	const { setIsFullScreen } = useContext( BottomSheetContext );
	const { setHeight } = useContext( BottomSheetNavigationContext );
	useEffect( () => {
		if ( isFullScreen && showSheet ) {
			setHeight( '100%' );
			setIsFullScreen( true );
		} else {
			setIsFullScreen( false );
			// setHeight( heightRef.current.maxHeight );
		}
	}, [ isFullScreen, showSheet ] );

	return (
		<>
			{ showSheet && <Fill>{ children }</Fill> }
			{ Children.count( children ) > 0 && navigationButton }
		</>
	);
};

BottomSheetSubSheet.Slot = Slot;
BottomSheetSubSheet.screenName = 'BottomSheetSubSheet';

export default BottomSheetSubSheet;
