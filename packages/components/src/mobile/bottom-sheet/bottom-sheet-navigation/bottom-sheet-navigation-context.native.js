/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

// Navigation context in BottomSheet is necessary for controlling the
// height of navigation container.
export const BottomSheetNavigationContext = createContext( {
	currentHeight: 1,
	setHeight: () => {},
} );

export const {
	Provider: BottomSheetNavigationProvider,
	Consumer: BottomSheetNavigationConsumer,
} = BottomSheetNavigationContext;
