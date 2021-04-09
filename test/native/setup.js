/**
 * External dependencies
 */
import 'react-native-gesture-handler/jestSetup';

// Mock component to render with props rather than merely a string name so that
// we may assert against it. ...args is used avoid warnings about ignoring
// forwarded refs if React.forwardRef happens to be used.
const mockComponent = ( element ) => ( ...args ) => {
	const [ props ] = args;
	const React = require( 'react' );
	return React.createElement( element, props, props.children );
};

jest.mock( '@wordpress/element', () => {
	return {
		__esModule: true,
		...jest.requireActual( '@wordpress/element' ),
		render: jest.fn(),
	};
} );

jest.mock( '@wordpress/react-native-bridge', () => {
	return {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		subscribeParentGetHtml: jest.fn(),
		subscribeParentToggleHTMLMode: jest.fn(),
		subscribeSetTitle: jest.fn(),
		subscribeSetFocusOnTitle: jest.fn(),
		subscribeUpdateHtml: jest.fn(),
		subscribeMediaAppend: jest.fn(),
		subscribeAndroidModalClosed: jest.fn(),
		subscribeUpdateTheme: jest.fn(),
		subscribePreferredColorScheme: () => 'light',
		subscribeUpdateCapabilities: jest.fn(),
		subscribeShowNotice: jest.fn(),
		editorDidMount: jest.fn(),
		editorDidAutosave: jest.fn(),
		subscribeMediaUpload: jest.fn(),
		subscribeMediaSave: jest.fn(),
		getOtherMediaOptions: jest.fn(),
		requestMediaPicker: jest.fn(),
		requestUnsupportedBlockFallback: jest.fn(),
		subscribeReplaceBlock: jest.fn(),
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

jest.mock(
	'@react-native-community/slider',
	() => {
		const { forwardRef } = require( 'react' );
		return forwardRef( mockComponent( 'Slider' ) );
	},
	{ virtual: true }
);

if ( ! global.window.matchMedia ) {
	global.window.matchMedia = () => ( {
		matches: false,
		addListener: () => {},
		removeListener: () => {},
	} );
}

jest.mock( 'react-native-linear-gradient', () => () => 'LinearGradient', {
	virtual: true,
} );

jest.mock( 'react-native-hsv-color-picker', () => () => 'HsvColorPicker', {
	virtual: true,
} );

jest.mock( '@react-native-community/blur', () => () => 'BlurView', {
	virtual: true,
} );

jest.mock( 'react-native-reanimated', () => {
	const Reanimated = require( 'react-native-reanimated/mock' );

	// The mock for `call` immediately calls the callback which is incorrect
	// So we override it with a no-op
	Reanimated.default.call = () => {};

	return Reanimated;
} );

// Silence the warning: Animated: `useNativeDriver` is not supported because the
// native animated module is missing. This was added per React Navigation docs.
// https://reactnavigation.org/docs/testing/#mocking-native-modules
jest.mock( 'react-native/Libraries/Animated/src/NativeAnimatedHelper' );

// We currently reference TextStateInput (a private module) within
// react-native-aztec/src/AztecView. Doing so requires that we mock it via its
// internal path to avoid "TypeError: Cannot read property 'Commands' of
// undefined." The private module referenced could possibly be replaced with
// a React ref instead. We could then remove this internal mock.
jest.mock( 'react-native/Libraries/Components/TextInput/TextInputState' );

// Mock native modules incompatible with testing environment
jest.mock(
	'react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo',
	() => ( {
		addEventListener: jest.fn(),
		announceForAccessibility: jest.fn(),
		removeEventListener: jest.fn(),
		isScreenReaderEnabled: jest.fn( () => Promise.resolve( false ) ),
	} )
);
