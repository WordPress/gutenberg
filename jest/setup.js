jest.mock('../react-native-gutenberg-bridge', () => {
	return {
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		subscribeParentGetHtml: jest.fn()
	}
})