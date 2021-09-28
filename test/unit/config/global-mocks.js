jest.mock( '@wordpress/compose', () => {
	const App = () => null;
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch: jest.fn(),
		useResizeObserver: jest.fn( () => [
			<App key={ 'mock-key' } />,
			{ width: 700, height: 500 },
		] ),
	};
} );
