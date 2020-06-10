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
	getTemplateIds,
	getTemplatePartIds,
	getPage,
	getShowOnFront,
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
			expect( getSettings( state ) ).toBe( state.settings );
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
			expect( getSettings( state ) ).toEqual( {
				key: 'value',
				focusMode: true,
				hasFixedToolbar: true,
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

	describe( 'getTemplateIds', () => {
		it( 'returns the template IDs', () => {
			const state = { templateIds: {} };
			expect( getTemplateIds( state ) ).toBe( state.templateIds );
		} );
	} );

	describe( 'getTemplatePartIds', () => {
		it( 'returns the template part IDs', () => {
			const state = { templatePartIds: {} };
			expect( getTemplatePartIds( state ) ).toBe( state.templatePartIds );
		} );
	} );

	describe( 'getPage', () => {
		it( 'returns the page object', () => {
			const state = { page: {} };
			expect( getPage( state ) ).toBe( state.page );
		} );
	} );

	describe( 'getShowOnFront', () => {
		it( 'returns the `show_on_front` setting', () => {
			const state = { showOnFront: {} };
			expect( getShowOnFront( state ) ).toBe( state.showOnFront );
		} );
	} );
} );
