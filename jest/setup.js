jest.mock( '../react-native-gutenberg-bridge', () => {
	return {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		subscribeParentGetHtml: jest.fn(),
		subscribeParentToggleHTMLMode: jest.fn(),
		subscribeSetTitle: jest.fn(),
		subscribeUpdateHtml: jest.fn(),
	};
} );

jest.mock( 'react-native-safe-area', () => {
	return {
		getSafeAreaInsetsForRootView: () => {
			return new Promise( ( accept ) => {
				accept( { safeAreaInsets: { bottom: 34 } } );
			} );
		},
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
	};
} );

jest.mock( 'react-native-recyclerview-list' );
