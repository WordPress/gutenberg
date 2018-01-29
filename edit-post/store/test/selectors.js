/**
 * Internal dependencies
 */
import {
	getEditorMode,
	getPreference,
	isSidebarOpened,
	hasOpenSidebar,
	isEditorSidebarPanelOpened,
	isMobile,
	hasFixedToolbar,
	isFeatureActive,
} from '../selectors';

jest.mock( '../constants', () => ( {
	BREAK_MEDIUM: 500,
} ) );

describe( 'selectors', () => {
	describe( 'getEditorMode', () => {
		it( 'should return the selected editor mode', () => {
			const state = {
				preferences: { mode: 'text' },
			};

			expect( getEditorMode( state ) ).toEqual( 'text' );
		} );

		it( 'should fallback to visual if not set', () => {
			const state = {
				preferences: {},
			};

			expect( getEditorMode( state ) ).toEqual( 'visual' );
		} );
	} );

	describe( 'getPreference', () => {
		it( 'should return the preference value if set', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return undefined if the preference is unset', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'ribs' ) ).toBeUndefined();
		} );

		it( 'should return the default value if provided', () => {
			const state = {
				preferences: {},
			};

			expect( getPreference( state, 'ribs', 'chicken' ) ).toEqual( 'chicken' );
		} );
	} );

	describe( 'isSidebarOpened', () => {
		it( 'should return true when is not mobile and the normal sidebar is opened', () => {
			const state = {
				mobile: false,
				preferences: {
					sidebars: {
						desktop: true,
						mobile: false,
					},
				},
			};

			expect( isSidebarOpened( state ) ).toBe( true );
		} );

		it( 'should return false when is not mobile and the normal sidebar is closed', () => {
			const state = {
				mobile: false,
				preferences: {
					sidebars: {
						desktop: false,
						mobile: true,
					},
				},
			};

			expect( isSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return true when is mobile and the mobile sidebar is opened', () => {
			const state = {
				mobile: true,
				preferences: {
					sidebars: {
						desktop: false,
						mobile: true,
					},
				},
			};

			expect( isSidebarOpened( state ) ).toBe( true );
		} );

		it( 'should return false when is mobile and the mobile sidebar is closed', () => {
			const state = {
				mobile: true,
				preferences: {
					sidebars: {
						desktop: true,
						mobile: false,
					},
				},
			};

			expect( isSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return true when the given is opened', () => {
			const state = {
				preferences: {
					sidebars: {
						publish: true,
					},
				},
			};

			expect( isSidebarOpened( state, 'publish' ) ).toBe( true );
		} );

		it( 'should return false when the given is not opened', () => {
			const state = {
				preferences: {
					sidebars: {
						publish: false,
					},
				},
			};

			expect( isSidebarOpened( state, 'publish' ) ).toBe( false );
		} );
	} );

	describe( 'hasOpenSidebar', () => {
		it( 'should return true if at least one sidebar is open (using the desktop sidebar as default)', () => {
			const state = {
				mobile: false,
				preferences: {
					sidebars: {
						desktop: true,
						mobile: false,
						publish: false,
					},
				},
			};

			expect( hasOpenSidebar( state ) ).toBe( true );
		} );

		it( 'should return true if at no sidebar is open (using the desktop sidebar as default)', () => {
			const state = {
				mobile: false,
				preferences: {
					sidebars: {
						desktop: false,
						mobile: true,
						publish: false,
					},
				},
			};

			expect( hasOpenSidebar( state ) ).toBe( false );
		} );

		it( 'should return true if at least one sidebar is open (using the mobile sidebar as default)', () => {
			const state = {
				mobile: true,
				preferences: {
					sidebars: {
						desktop: false,
						mobile: true,
						publish: false,
					},
				},
			};

			expect( hasOpenSidebar( state ) ).toBe( true );
		} );

		it( 'should return true if at no sidebar is open (using the mobile sidebar as default)', () => {
			const state = {
				mobile: true,
				preferences: {
					sidebars: {
						desktop: true,
						mobile: false,
						publish: false,
					},
				},
			};

			expect( hasOpenSidebar( state ) ).toBe( false );
		} );
	} );

	describe( 'isEditorSidebarPanelOpened', () => {
		it( 'should return false if no panels preference', () => {
			const state = {
				preferences: {},
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
		} );

		it( 'should return false if the panel value is not set', () => {
			const state = {
				preferences: { panels: {} },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
		} );

		it( 'should return the panel value', () => {
			const state = {
				preferences: { panels: { 'post-taxonomies': true } },
			};

			expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( true );
		} );
	} );

	describe( 'isMobile', () => {
		it( 'should return true if resolution is equal or less than medium breakpoint', () => {
			const state = {
				mobile: true,
			};

			expect( isMobile( state ) ).toBe( true );
		} );

		it( 'should return true if resolution is greater than medium breakpoint', () => {
			const state = {
				mobile: false,
			};

			expect( isMobile( state ) ).toBe( false );
		} );
	} );

	describe( 'hasFixedToolbar', () => {
		it( 'should return true if fixedToolbar is active and is not mobile screen size', () => {
			const state = {
				mobile: false,
				preferences: {
					features: {
						fixedToolbar: true,
					},
				},
			};

			expect( hasFixedToolbar( state ) ).toBe( true );
		} );

		it( 'should return false if fixedToolbar is active and is mobile screen size', () => {
			const state = {
				mobile: true,
				preferences: {
					features: {
						fixedToolbar: true,
					},
				},
			};

			expect( hasFixedToolbar( state ) ).toBe( false );
		} );

		it( 'should return false if fixedToolbar is disable and is not mobile screen size', () => {
			const state = {
				mobile: false,
				preferences: {
					features: {
						fixedToolbar: false,
					},
				},
			};

			expect( hasFixedToolbar( state ) ).toBe( false );
		} );

		it( 'should return false if fixedToolbar is disable and is mobile screen size', () => {
			const state = {
				mobile: true,
				preferences: {
					features: {
						fixedToolbar: false,
					},
				},
			};

			expect( hasFixedToolbar( state ) ).toBe( false );
		} );
	} );

	describe( 'isFeatureActive', () => {
		it( 'should return true if feature is active', () => {
			const state = {
				preferences: {
					features: {
						chicken: true,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return false if feature is not active', () => {
			const state = {
				preferences: {
					features: {
						chicken: false,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );

		it( 'should return false if feature is not referred', () => {
			const state = {
				preferences: {
					features: {
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );
	} );
} );
