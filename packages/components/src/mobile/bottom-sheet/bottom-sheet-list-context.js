/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

// List context in BottomSheet is necessary for controlling the
// nested lists inside the bottom-sheet.
export const BottomSheetListContext = createContext( {
	listProps: {},
	setIsChildrenScrollable: () => {},
} );

export const {
	Provider: BottomSheetListProvider,
	Consumer: BottomSheetListConsumer,
} = BottomSheetListContext;
