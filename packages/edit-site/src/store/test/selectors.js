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
	getDefaultTemplateType,
	getDefaultTemplateTypes,
	getTemplateInfo,
} from '../selectors';

describe( 'selectors', () => {
	const defaultTemplateTypes = [
		{
			title: 'Default (Index)',
			description: 'Main template',
			slug: 'index',
		},
		{
			title: '404 (Not Found)',
			description: 'Applied when content cannot be found',
			slug: 404,
		},
	];
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

	describe( 'getDefaultTemplateTypes', () => {
		const state = { settings: { defaultTemplateTypes } };

		it( 'returns undefined if there are no default template types', () => {
			const emptyState = { settings: {} };
			expect( getDefaultTemplateTypes( emptyState ) ).toBeUndefined();
		} );

		it( 'returns a list of default template types if present in state', () => {
			expect( getDefaultTemplateTypes( state ) ).toHaveLength( 2 );
		} );
	} );

	describe( 'getDefaultTemplateType', () => {
		const state = { settings: { defaultTemplateTypes } };

		it( 'returns an empty object if there are no default template types', () => {
			const emptyState = { settings: {} };
			expect( getDefaultTemplateType( emptyState, 'slug' ) ).toEqual(
				{}
			);
		} );

		it( 'returns an empty object if the requested slug is not found', () => {
			expect( getDefaultTemplateType( state, 'foobar' ) ).toEqual( {} );
		} );

		it( 'returns the requested default template type ', () => {
			expect( getDefaultTemplateType( state, 'index' ) ).toEqual( {
				title: 'Default (Index)',
				description: 'Main template',
				slug: 'index',
			} );
		} );

		it( 'returns the requested default template type even when the slug is numeric with mismatched types', () => {
			expect( getDefaultTemplateType( state, '404' ) ).toEqual( {
				title: '404 (Not Found)',
				description: 'Applied when content cannot be found',
				slug: 404,
			} );
		} );
	} );

	describe( 'getTemplateInfo', () => {
		const state = { settings: { defaultTemplateTypes } };

		it( 'should return an empty object if no template is passed', () => {
			expect( getTemplateInfo( state, null ) ).toEqual( {} );
			expect( getTemplateInfo( state, undefined ) ).toEqual( {} );
			expect( getTemplateInfo( state, false ) ).toEqual( {} );
		} );

		it( 'should return the default title if none is defined on the template', () => {
			expect( getTemplateInfo( state, { slug: 'index' } ).title ).toEqual(
				'Default (Index)'
			);
		} );

		it( 'should return the rendered title if defined on the template', () => {
			expect(
				getTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
				} ).title
			).toEqual( 'test title' );
		} );

		it( 'should return the slug if no title is found', () => {
			expect(
				getTemplateInfo( state, { slug: 'not a real template' } ).title
			).toEqual( 'not a real template' );
		} );

		it( 'should return the default description if none is defined on the template', () => {
			expect(
				getTemplateInfo( state, { slug: 'index' } ).description
			).toEqual( 'Main template' );
		} );

		it( 'should return the raw excerpt as description if defined on the template', () => {
			expect(
				getTemplateInfo( state, {
					slug: 'index',
					excerpt: { raw: 'test description' },
				} ).description
			).toEqual( 'test description' );
		} );

		it( 'should return both a title and a description', () => {
			expect( getTemplateInfo( state, { slug: 'index' } ) ).toEqual( {
				title: 'Default (Index)',
				description: 'Main template',
			} );

			expect(
				getTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
				} )
			).toEqual( {
				title: 'test title',
				description: 'Main template',
			} );

			expect(
				getTemplateInfo( state, {
					slug: 'index',
					excerpt: { raw: 'test description' },
				} )
			).toEqual( {
				title: 'Default (Index)',
				description: 'test description',
			} );

			expect(
				getTemplateInfo( state, {
					slug: 'index',
					title: { rendered: 'test title' },
					excerpt: { raw: 'test description' },
				} )
			).toEqual( {
				title: 'test title',
				description: 'test description',
			} );
		} );
	} );
} );
