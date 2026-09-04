let mockRegisteredStore;
let mockCurrentContext;
let mockElementRef;

jest.mock( '@wordpress/interactivity', () => ( {
	store: ( name, config ) => {
		mockRegisteredStore = config;
		return config;
	},
	getContext: () => mockCurrentContext,
	getElement: () => ( { ref: mockElementRef } ),
	withSyncEvent: ( fn ) => fn,
} ) );

describe( 'Navigation view script', () => {
	beforeEach( async () => {
		jest.resetModules();
		mockRegisteredStore = null;
		mockCurrentContext = null;
		mockElementRef = { focus: jest.fn() };
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

	it( 'reports a submenu set to open on click as collapsed inside an open overlay', () => {
		mockCurrentContext = {
			type: 'submenu',
			openOnClick: true,
			submenuOpenedBy: { click: false, hover: false, focus: false },
			overlayOpenedBy: { click: true, hover: false, focus: false },
		};

		const { state, actions } = mockRegisteredStore;

		// The overlay unfolds every other submenu, but this one waits for its
		// toggle.
		expect( state.isSubmenuOpen ).toBe( false );

		actions.toggleMenuOnClick();
		expect( mockCurrentContext.submenuOpenedBy.click ).toBe( true );
		expect( state.isSubmenuOpen ).toBe( true );

		actions.toggleMenuOnClick();
		expect( mockCurrentContext.submenuOpenedBy.click ).toBe( false );
		expect( state.isSubmenuOpen ).toBe( false );
	} );

	it( 'keeps a submenu set to open on click expanded when focus leaves it inside an open overlay', () => {
		mockCurrentContext = {
			type: 'submenu',
			openOnClick: true,
			modal: { contains: () => false },
			submenuOpenedBy: { click: true, hover: false, focus: false },
			overlayOpenedBy: { click: true, hover: false, focus: false },
		};

		const { state, actions } = mockRegisteredStore;

		// Inside the overlay the submenu is an accordion, so tabbing past it
		// leaves it expanded.
		actions.handleMenuFocusout( { relatedTarget: null, target: {} } );

		expect( mockCurrentContext.submenuOpenedBy.click ).toBe( true );
		expect( state.isSubmenuOpen ).toBe( true );
	} );

	it( 'closes a submenu set to open on click when focus leaves it outside the overlay', () => {
		mockCurrentContext = {
			type: 'submenu',
			openOnClick: true,
			modal: { contains: () => false },
			submenuOpenedBy: { click: true, hover: false, focus: false },
			overlayOpenedBy: { click: false, hover: false, focus: false },
		};

		const { state, actions } = mockRegisteredStore;

		// As a flyout it still dismisses itself.
		actions.handleMenuFocusout( { relatedTarget: null, target: {} } );

		expect( mockCurrentContext.submenuOpenedBy.click ).toBe( false );
		expect( state.isSubmenuOpen ).toBe( false );
	} );
} );
