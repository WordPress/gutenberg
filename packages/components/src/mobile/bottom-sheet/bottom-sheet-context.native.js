/**
 * External dependencies
 */
import { Platform, UIManager } from 'react-native';
/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

// It's needed to set the following flags via UIManager
// to have `LayoutAnimation` working on Android
if (
	Platform.OS === 'android' &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental( true );
}

// Context in BottomSheet is necessary for controlling the
// transition flow between subsheets and replacing a content inside them
export const {
	Provider: BottomSheetProvider,
	Consumer: BottomSheetConsumer,
} = createContext( {
	// Specifies whether content is currently scrolling
	isBottomSheetContentScrolling: false,
	// Function called to enable scroll within bottom sheet
	shouldEnableBottomSheetScroll: () => {},
	// Function called to disable bottom sheet max height.
	// E.g. used to extend bottom sheet on full screen in ColorPicker,
	// which is helpful on small devices with set the largest font/display size.
	shouldDisableBottomSheetMaxHeight: () => {},
	// Callback that is called on closing bottom sheet
	onCloseBottomSheet: () => {},
	// Android only: Function called to control android hardware back button functionality
	onHardwareButtonPress: () => {},
	// Function called to navigate to another subsheet
	onReplaceSubsheet: () => {},
	// Object contains extra data passed to the current subsheet
	extraProps: {},
	// Specifies the currently active subsheet name
	currentScreen: undefined,
} );
