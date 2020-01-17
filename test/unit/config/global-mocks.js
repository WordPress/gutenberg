jest.mock( '@wordpress/compose', () => {
	return {
		...jest.requireActual( '@wordpress/compose' ),
		useViewportMatch: jest.fn(),
	};
} );
