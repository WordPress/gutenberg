/**
 * External dependencies
 */
import { fireEvent, render } from 'test/helpers';
import { LayoutAnimation } from 'react-native';

/**
 * Internal dependencies
 */
import BottomSheet from '../';

it( 'does not animate transitions between header heights differing less than 1 pixel', () => {
	const screen = render( <BottomSheet isVisible /> );

	const bottomSheetHeader = screen.getByTestId( 'bottom-sheet-header' );
	fireEvent( bottomSheetHeader, 'layout', {
		nativeEvent: { layout: { height: 123 } },
	} );
	fireEvent( bottomSheetHeader, 'layout', {
		nativeEvent: { layout: { height: 123.001 } },
	} );

	expect( LayoutAnimation.configureNext ).not.toHaveBeenCalled();
} );
