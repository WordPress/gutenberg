/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

// Context in BottomSheet is necessary for controlling the
// transition flow between subsheets and replacing a content inside them
export const BottomSheetContext = createContext( {
	// Specifies whether content is currently scrolling
	isBottomSheetContentScrolling: false,
	// Function called to enable scroll within bottom sheet
	shouldEnableBottomSheetScroll: () => {},
	// Function called to enable/disable bottom sheet max height.
	// E.g. used to extend bottom sheet on full screen in ColorPicker,
	// which is helpful on small devices with set the largest font/display size.
	shouldEnableBottomSheetMaxHeight: () => {},
	// Callback that is called on closing bottom sheet
	onHandleClosingBottomSheet: () => {},
	// Android only: Function called to control android hardware back button functionality
	// Return true if the bottom-sheet default close action shouldn't be called
	onHandleHardwareButtonPress: () => {},
} );

export const {
	Provider: BottomSheetProvider,
	Consumer: BottomSheetConsumer,
} = BottomSheetContext;
