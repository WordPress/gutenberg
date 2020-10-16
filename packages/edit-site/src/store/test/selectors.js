/**
 * Internal dependencies
 */
import {
	isFeatureActive,
	getCanUserCreateMedia,
	getSettings,
	getHomeTemplateId,
	getTemplateId,
	getTemplatePartId,
	getTemplateType,
	getPage,
	getNavigationPanelActiveMenu,
	isNavigationOpened,
	isInserterOpened,
} from '../selectors';

describe( 'selectors', () => {
	const canUser = jest.fn( () => true );
	getCanUserCreateMedia.registry = {
		select: jest.fn( () => ( { canUser } ) ),
	};

	describe( 'isFeatureActive', () => {
		it( 'is tolerant to an undefined features preference', () => {
			// See: https://github.com/WordPress/gutenberg/issues/14580
			const state = {
				preferences: {},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );

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
					features: {},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );
	} );

	describe( 'getCanUserCreateMedia', () => {
		it( "selects `canUser( 'create', 'media' )` from the core store", () => {
			expect( getCanUserCreateMedia() ).toBe( true );
			expect(
				getCanUserCreateMedia.registry.select
			).toHaveBeenCalledWith( 'core' );
			expect( canUser ).toHaveBeenCalledWith( 'create', 'media' );
		} );
	} );

	describe( 'getSettings', () => {
		it( "returns the settings when the user can't create media", () => {
			canUser.mockReturnValueOnce( false );
			canUser.mockReturnValueOnce( false );
			const state = { settings: {}, preferences: {} };
			const setInserterOpened = () => {};
			expect( getSettings( state, setInserterOpened ) ).toEqual( {
				focusMode: false,
				hasFixedToolbar: false,
				__experimentalSetIsInserterOpened: setInserterOpened,
			} );
		} );

		it( 'returns the extended settings when the user can create media', () => {
			const state = {
				settings: { key: 'value' },
				preferences: {
					features: {
						focusMode: true,
						fixedToolbar: true,
					},
				},
			};
			const setInserterOpened = () => {};
			expect( getSettings( state, setInserterOpened ) ).toEqual( {
				key: 'value',
				focusMode: true,
				hasFixedToolbar: true,
				__experimentalSetIsInserterOpened: setInserterOpened,
				mediaUpload: expect.any( Function ),
			} );
		} );
	} );

	describe( 'getHomeTemplateId', () => {
		it( 'returns the home template ID', () => {
			const state = { homeTemplateId: {} };
			expect( getHomeTemplateId( state ) ).toBe( state.homeTemplateId );
		} );
	} );

	describe( 'getTemplateId', () => {
		it( 'returns the template ID', () => {
			const state = { templateId: {} };
			expect( getTemplateId( state ) ).toBe( state.templateId );
		} );
	} );

	describe( 'getTemplatePartId', () => {
		it( 'returns the template part ID', () => {
			const state = { templatePartId: {} };
			expect( getTemplatePartId( state ) ).toBe( state.templatePartId );
		} );
	} );

	describe( 'getTemplateType', () => {
		it( 'returns the template type', () => {
			const state = { templateType: {} };
			expect( getTemplateType( state ) ).toBe( state.templateType );
		} );
	} );

	describe( 'getPage', () => {
		it( 'returns the page object', () => {
			const state = { page: {} };
			expect( getPage( state ) ).toBe( state.page );
		} );
	} );

	describe( 'getNavigationPanelActiveMenu', () => {
		it( 'returns the current navigation menu', () => {
			const state = {
				navigationPanel: { menu: 'test-menu', isOpen: false },
			};
			expect( getNavigationPanelActiveMenu( state ) ).toBe( 'test-menu' );
		} );
	} );

	describe( 'isNavigationOpened', () => {
		it( 'returns the navigation panel isOpened state', () => {
			const state = {
				navigationPanel: { menu: 'test-menu', isOpen: false },
			};
			expect( isNavigationOpened( state ) ).toBe( false );
			state.navigationPanel.isOpen = true;
			expect( isNavigationOpened( state ) ).toBe( true );
		} );
	} );

	describe( 'isInserterOpened', () => {
		it( 'returns the block inserter panel isOpened state', () => {
			const state = {
				blockInserterPanel: true,
			};
			expect( isInserterOpened( state ) ).toBe( true );
			state.blockInserterPanel = false;
			expect( isInserterOpened( state ) ).toBe( false );
		} );
	} );
} );
