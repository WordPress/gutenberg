/**
 * External dependencies
 */
import { NativeModules } from 'react-native';

jest.mock( 'react-native-gutenberg-bridge', () => {
	return {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		subscribeParentGetHtml: jest.fn(),
		subscribeParentToggleHTMLMode: jest.fn(),
		subscribeSetTitle: jest.fn(),
		subscribeSetFocusOnTitle: jest.fn(),
		subscribeUpdateHtml: jest.fn(),
		subscribeMediaAppend: jest.fn(),
		editorDidMount: jest.fn(),
		editorDidAutosave: jest.fn(),
		subscribeMediaUpload: jest.fn(),
		getOtherMediaOptions: jest.fn(),
		requestMediaPicker: jest.fn(),
		mediaSources: {
			deviceLibrary: 'DEVICE_MEDIA_LIBRARY',
			deviceCamera: 'DEVICE_CAMERA',
			siteMediaLibrary: 'SITE_MEDIA_LIBRARY',
		},
	};
} );

jest.mock( 'react-native-dark-mode', () => {
	return {
		initialMode: 'light',
		eventEmitter: {
			on: jest.fn(),
		},
		useDarkModeContext: () => 'light',
	};
} );

jest.mock( 'react-native-modal', () => () => 'Modal' );

jest.mock( 'react-native-hr', () => () => 'Hr' );

jest.mock( 'react-native-svg', () => {
	return {
		Svg: () => 'Svg',
		Path: () => 'Path',
		Circle: () => 'Circle',
		G: () => 'G',
		Polygon: () => 'Polygon',
		Rect: () => 'Rect',
	};
} );

jest.mock( 'react-native-safe-area', () => {
	const addEventListener = jest.fn();
	addEventListener.mockReturnValue( { remove: () => {} } );
	return {
		getSafeAreaInsetsForRootView: () => {
			return new Promise( ( accept ) => {
				accept( { safeAreaInsets: { bottom: 34 } } );
			} );
		},
		addEventListener,
		removeEventListener: jest.fn(),
	};
} );

jest.mock( 'react-native-recyclerview-list' );

jest.mock( '@react-native-community/slider', () => () => 'Slider', { virtual: true } );

if ( ! global.window.matchMedia ) {
	global.window.matchMedia = () => ( {
		matches: false,
		addListener: () => {},
		removeListener: () => {},
	} );
}

// Overwrite some native module mocks from `react-native` jest preset:
// https://github.com/facebook/react-native/blob/master/jest/setup.js
// to fix issue "TypeError: Cannot read property 'Commands' of undefined"
// raised when calling focus or blur on a native component
const mockNativeModules = {
	UIManager: {
		...NativeModules.UIManager,
		getViewManagerConfig: jest.fn( () => ( { Commands: {} } ) ),
	},
};

Object.keys( mockNativeModules ).forEach( ( module ) => {
	try {
		jest.doMock( module, () => mockNativeModules[ module ] ); // needed by FacebookSDK-test
	} catch ( error ) {
		jest.doMock( module, () => mockNativeModules[ module ], { virtual: true } );
	}
} );
