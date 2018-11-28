jest.mock( '../react-native-gutenberg-bridge', () => {
	return {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		subscribeParentGetHtml: jest.fn(),
		subscribeParentToggleHTMLMode: jest.fn(),
	};
} );

jest.mock( 'react-native-recyclerview-list' );
