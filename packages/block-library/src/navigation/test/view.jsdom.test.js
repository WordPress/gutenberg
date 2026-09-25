import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockRegisteredStore;
let mockCurrentContext;

vi.mock( import( '@wordpress/interactivity' ), () => ( {
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
		vi.resetModules();
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

	it( 'keeps a submenu inside an open custom overlay closed until it is opened', () => {
		// A custom overlay is excluded from the styles that display every
		// submenu, so opening the overlay must not report the submenu as open.
		mockCurrentContext = {
			type: 'submenu',
			submenuOpenedBy: { click: false, hover: false, focus: false },
			overlayOpenedBy: { click: true, hover: false, focus: false },
			hasCustomOverlay: true,
		};

		const { state, actions } = mockRegisteredStore;

		expect( state.isSubmenuOpen ).toBe( false );

		// Opening the submenu itself is what expands it.
		actions.openMenu( 'click' );
		expect( state.isSubmenuOpen ).toBe( true );

		// And it can be closed again while the overlay stays open.
		actions.closeMenu( 'click' );
		expect( state.isSubmenuOpen ).toBe( false );
	} );
} );
