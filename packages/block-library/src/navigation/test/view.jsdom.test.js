let mockRegisteredStore;
let mockCurrentContext;

jest.mock( '@wordpress/interactivity', () => ( {
	store: ( name, config ) => {
		mockRegisteredStore = config;
		return config;
	},
	getContext: () => mockCurrentContext,
	getElement: () => ( { ref: {} } ),
	withSyncEvent: ( fn ) => fn,
} ) );

describe( 'Navigation view script', () => {
	beforeEach( async () => {
		jest.resetModules();
		mockRegisteredStore = null;
		mockCurrentContext = null;
		// Import the view.js script to register the store
		await import( '../view.js' );
	} );

	it( 'updates submenuOpenedBy.hover when hovering a submenu inside an open overlay', () => {
		// Mock the context for a submenu inside an open overlay
		mockCurrentContext = {
			type: 'submenu',
			submenuOpenedBy: { click: false, hover: false, focus: false },
			overlayOpenedBy: { click: true, hover: false, focus: false },
		};

		const { state, actions } = mockRegisteredStore;

		// Verify initial state
		expect( state.isSubmenuOpen ).toBe( true ); // because overlay is open
		expect( mockCurrentContext.submenuOpenedBy.hover ).toBe( false );

		// Simulate hover enter
		actions.openMenuOnHover( { pointerType: 'mouse' } );

		// Verify that hover state is tracked even though submenu is already "open" visually
		expect( mockCurrentContext.submenuOpenedBy.hover ).toBe( true );
		expect( state.isSubmenuOpen ).toBe( true ); // remains true

		// Simulate hover leave
		actions.closeMenuOnHover( { pointerType: 'mouse' } );

		// Verify hover state is cleared
		expect( mockCurrentContext.submenuOpenedBy.hover ).toBe( false );
		expect( state.isSubmenuOpen ).toBe( true ); // remains true because overlay is still open
	} );
} );
