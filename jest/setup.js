/**
 * External dependencies
 */
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
configure( { adapter: new Adapter() } );

jest.mock( '../react-native-gutenberg-bridge', () => {
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

if ( ! global.window.matchMedia ) {
	global.window.matchMedia = () => ( {
		matches: false,
		addListener: () => {},
		removeListener: () => {},
	} );
}
