/**
 * Tests for store reducer.
 */

/**
 * Internal dependencies
 */
import reducer from '../reducer';
import {
	RECEIVE_ABILITIES,
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	RECEIVE_CATEGORIES,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
} from '../constants';

describe( 'Store Reducer', () => {
	describe( 'abilitiesByName', () => {
		const defaultState = {};

		describe( 'RECEIVE_ABILITIES', () => {
			it( 'should add abilities to the state', () => {
				const abilities = [
					{
						name: 'test/ability1',
						label: 'Test Ability 1',
						description: 'First test ability',
						input_schema: { type: 'object' },
					},
					{
						name: 'test/ability2',
						label: 'Test Ability 2',
						description: 'Second test ability',
						output_schema: { type: 'object' },
					},
				];

				const action = {
					type: RECEIVE_ABILITIES,
					abilities,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);

				expect( state.abilitiesByName ).toHaveProperty(
					'test/ability1'
				);
				expect( state.abilitiesByName ).toHaveProperty(
					'test/ability2'
				);
				expect( state.abilitiesByName[ 'test/ability1' ].label ).toBe(
					'Test Ability 1'
				);
				expect( state.abilitiesByName[ 'test/ability2' ].label ).toBe(
					'Test Ability 2'
				);
			} );

			it( 'should filter out _links from server responses', () => {
				const abilities = [
					{
						name: 'test/ability',
						label: 'Test Ability',
						description: 'Test ability with links',
						_links: {
							self: {
								href: '/wp-abilities/v1/abilities/test/ability',
							},
							collection: { href: '/wp-abilities/v1/abilities' },
						},
					},
				];

				const action = {
					type: RECEIVE_ABILITIES,
					abilities,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);

				expect(
					state.abilitiesByName[ 'test/ability' ]
				).not.toHaveProperty( '_links' );
				expect( state.abilitiesByName[ 'test/ability' ].name ).toBe(
					'test/ability'
				);
				expect( state.abilitiesByName[ 'test/ability' ].label ).toBe(
					'Test Ability'
				);
			} );

			it( 'should filter out _embedded from server responses', () => {
				const abilities = [
					{
						name: 'test/ability',
						label: 'Test Ability',
						description: 'Test ability with embedded',
						_embedded: {
							author: { id: 1, name: 'Admin' },
						},
					},
				];

				const action = {
					type: RECEIVE_ABILITIES,
					abilities,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);

				expect(
					state.abilitiesByName[ 'test/ability' ]
				).not.toHaveProperty( '_embedded' );
			} );

			it( 'should preserve all valid ability properties', () => {
				const abilities = [
					{
						name: 'test/ability',
						label: 'Test Ability',
						description: 'Full test ability.',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
						meta: {
							category: 'test',
						},
						callback: () => Promise.resolve( {} ),
						permissionCallback: () => true,
						// Extra properties that should be filtered out
						_links: { self: { href: '/test' } },
						_embedded: { test: 'value' },
						extra_field: 'should be removed',
					},
				];

				const action = {
					type: RECEIVE_ABILITIES,
					abilities,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);
				const ability = state.abilitiesByName[ 'test/ability' ];

				// Should have valid properties
				expect( ability.name ).toBe( 'test/ability' );
				expect( ability.label ).toBe( 'Test Ability' );
				expect( ability.description ).toBe( 'Full test ability.' );
				expect( ability.input_schema ).toEqual( { type: 'object' } );
				expect( ability.output_schema ).toEqual( { type: 'object' } );
				expect( ability.meta ).toEqual( { category: 'test' } );
				expect( ability.callback ).toBeDefined();
				expect( ability.permissionCallback ).toBeDefined();

				// Should NOT have invalid properties
				expect( ability ).not.toHaveProperty( '_links' );
				expect( ability ).not.toHaveProperty( '_embedded' );
				expect( ability ).not.toHaveProperty( 'extra_field' );
			} );
		} );

		describe( 'REGISTER_ABILITY', () => {
			it( 'should add ability to the state', () => {
				const ability = {
					name: 'test/ability',
					label: 'Test Ability',
					description: 'Test ability',
					callback: () => Promise.resolve( {} ),
				};

				const action = {
					type: REGISTER_ABILITY,
					ability,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);

				expect( state.abilitiesByName ).toHaveProperty(
					'test/ability'
				);
				expect( state.abilitiesByName[ 'test/ability' ].label ).toBe(
					'Test Ability'
				);
			} );

			it( 'should filter out extra properties when registering', () => {
				const ability = {
					name: 'test/ability',
					label: 'Test Ability',
					description: 'Test ability',
					callback: () => Promise.resolve( {} ),
					// Extra properties that should be filtered out
					_links: { self: { href: '/test' } },
					extra_field: 'should be removed',
				};

				const action = {
					type: REGISTER_ABILITY,
					ability,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);
				const registeredAbility =
					state.abilitiesByName[ 'test/ability' ];

				// Should have valid properties
				expect( registeredAbility.name ).toBe( 'test/ability' );
				expect( registeredAbility.label ).toBe( 'Test Ability' );
				expect( registeredAbility.description ).toBe( 'Test ability' );
				expect( registeredAbility.callback ).toBeDefined();

				// Should NOT have invalid properties
				expect( registeredAbility ).not.toHaveProperty( '_links' );
				expect( registeredAbility ).not.toHaveProperty( 'extra_field' );
			} );

			it( 'should replace existing ability', () => {
				const initialState = {
					'test/ability': {
						name: 'test/ability',
						label: 'Old Label',
						description: 'Old description',
					},
				};

				const ability = {
					name: 'test/ability',
					label: 'New Label',
					description: 'New description',
					input_schema: { type: 'string' },
				};

				const action = {
					type: REGISTER_ABILITY,
					ability,
				};

				const state = reducer(
					{ abilitiesByName: initialState },
					action
				);

				expect( state.abilitiesByName[ 'test/ability' ].label ).toBe(
					'New Label'
				);
				expect(
					state.abilitiesByName[ 'test/ability' ].description
				).toBe( 'New description' );
				expect(
					state.abilitiesByName[ 'test/ability' ].input_schema
				).toEqual( { type: 'string' } );
			} );
		} );

		describe( 'UNREGISTER_ABILITY', () => {
			it( 'should remove ability from the state', () => {
				const initialState = {
					'test/ability1': {
						name: 'test/ability1',
						label: 'Test Ability 1',
						description: 'First test ability',
					},
					'test/ability2': {
						name: 'test/ability2',
						label: 'Test Ability 2',
						description: 'Second test ability',
					},
				};

				const action = {
					type: UNREGISTER_ABILITY,
					name: 'test/ability1',
				};

				const state = reducer(
					{ abilitiesByName: initialState },
					action
				);

				expect( state.abilitiesByName ).not.toHaveProperty(
					'test/ability1'
				);
				expect( state.abilitiesByName ).toHaveProperty(
					'test/ability2'
				);
			} );
		} );

		describe( 'Edge cases', () => {
			it( 'should handle unregistering non-existent ability', () => {
				const initialState = {
					'test/ability': {
						name: 'test/ability',
						label: 'Test Ability',
						description: 'Test ability',
					},
				};

				const action = {
					type: UNREGISTER_ABILITY,
					name: 'test/non-existent',
				};

				const state = reducer(
					{ abilitiesByName: initialState },
					action
				);

				expect( state.abilitiesByName ).toEqual( initialState );
			} );

			it( 'should handle undefined abilities in RECEIVE_ABILITIES', () => {
				const action = {
					type: RECEIVE_ABILITIES,
					abilities: undefined,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);

				expect( state.abilitiesByName ).toEqual( defaultState );
			} );

			it( 'should handle undefined ability in REGISTER_ABILITY', () => {
				const action = {
					type: REGISTER_ABILITY,
					ability: undefined,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);

				expect( state.abilitiesByName ).toEqual( defaultState );
			} );

			it( 'should handle undefined properties gracefully', () => {
				const abilities = [
					{
						name: 'test/minimal',
						label: 'Minimal',
						description:
							'Minimal ability with undefined properties',
						input_schema: undefined,
						output_schema: undefined,
						meta: undefined,
						callback: undefined,
						permissionCallback: undefined,
					},
				];

				const action = {
					type: RECEIVE_ABILITIES,
					abilities,
				};

				const state = reducer(
					{ abilitiesByName: defaultState },
					action
				);
				const ability = state.abilitiesByName[ 'test/minimal' ];

				expect( ability.name ).toBe( 'test/minimal' );
				expect( ability.label ).toBe( 'Minimal' );
				expect( ability.description ).toBe(
					'Minimal ability with undefined properties'
				);
				// Undefined properties should not be present
				expect( ability ).not.toHaveProperty( 'input_schema' );
				expect( ability ).not.toHaveProperty( 'output_schema' );
				expect( ability ).not.toHaveProperty( 'meta' );
				expect( ability ).not.toHaveProperty( 'callback' );
				expect( ability ).not.toHaveProperty( 'permissionCallback' );
			} );
		} );
	} );

	describe( 'categoriesBySlug', () => {
		const defaultState = {};

		describe( 'RECEIVE_CATEGORIES', () => {
			it( 'should add categories to the state', () => {
				const categories = [
					{
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'Abilities that retrieve data',
					},
					{
						slug: 'user-management',
						label: 'User Management',
						description: 'Abilities for managing users',
					},
				];

				const action = {
					type: RECEIVE_CATEGORIES,
					categories,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toHaveProperty(
					'data-retrieval'
				);
				expect( state.categoriesBySlug ).toHaveProperty(
					'user-management'
				);
				expect( state.categoriesBySlug[ 'data-retrieval' ].label ).toBe(
					'Data Retrieval'
				);
				expect(
					state.categoriesBySlug[ 'user-management' ].label
				).toBe( 'User Management' );
			} );

			it( 'should filter out _links from server responses', () => {
				const categories = [
					{
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'Test category with links',
						_links: {
							self: {
								href: '/wp-abilities/v1/categories/data-retrieval',
							},
							collection: {
								href: '/wp-abilities/v1/categories',
							},
						},
					},
				];

				const action = {
					type: RECEIVE_CATEGORIES,
					categories,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect(
					state.categoriesBySlug[ 'data-retrieval' ]
				).not.toHaveProperty( '_links' );
				expect( state.categoriesBySlug[ 'data-retrieval' ].slug ).toBe(
					'data-retrieval'
				);
				expect( state.categoriesBySlug[ 'data-retrieval' ].label ).toBe(
					'Data Retrieval'
				);
			} );

			it( 'should filter out _embedded from server responses', () => {
				const categories = [
					{
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'Test category with embedded',
						_embedded: {
							author: { id: 1, name: 'Admin' },
						},
					},
				];

				const action = {
					type: RECEIVE_CATEGORIES,
					categories,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect(
					state.categoriesBySlug[ 'data-retrieval' ]
				).not.toHaveProperty( '_embedded' );
			} );

			it( 'should preserve all valid category properties', () => {
				const categories = [
					{
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'Full test category.',
						meta: {
							priority: 'high',
							color: 'blue',
						},
						// Extra properties that should be filtered out
						_links: { self: { href: '/test' } },
						_embedded: { test: 'value' },
						extra_field: 'should be removed',
					},
				];

				const action = {
					type: RECEIVE_CATEGORIES,
					categories,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);
				const category = state.categoriesBySlug[ 'data-retrieval' ];

				// Should have valid properties
				expect( category.slug ).toBe( 'data-retrieval' );
				expect( category.label ).toBe( 'Data Retrieval' );
				expect( category.description ).toBe( 'Full test category.' );
				expect( category.meta ).toEqual( {
					priority: 'high',
					color: 'blue',
				} );

				// Should NOT have invalid properties
				expect( category ).not.toHaveProperty( '_links' );
				expect( category ).not.toHaveProperty( '_embedded' );
				expect( category ).not.toHaveProperty( 'extra_field' );
			} );

			it( 'should overwrite existing categories', () => {
				const initialState = {
					'existing-category': {
						slug: 'existing-category',
						label: 'Existing Category',
						description: 'Already in store',
					},
				};

				const categories = [
					{
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'New category',
					},
				];

				const action = {
					type: RECEIVE_CATEGORIES,
					categories,
				};

				const state = reducer(
					{ categoriesBySlug: initialState, abilitiesByName: {} },
					action
				);

				// Should only have new categories, old ones are replaced
				expect( state.categoriesBySlug ).not.toHaveProperty(
					'existing-category'
				);
				expect( state.categoriesBySlug ).toHaveProperty(
					'data-retrieval'
				);
			} );
		} );

		describe( 'Edge cases', () => {
			it( 'should handle undefined categories in RECEIVE_CATEGORIES', () => {
				const action = {
					type: RECEIVE_CATEGORIES,
					categories: undefined,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toEqual( defaultState );
			} );

			it( 'should handle empty categories array', () => {
				const action = {
					type: RECEIVE_CATEGORIES,
					categories: [],
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toEqual( defaultState );
			} );

			it( 'should handle undefined properties gracefully', () => {
				const categories = [
					{
						slug: 'minimal',
						label: 'Minimal',
						description: 'Minimal category with undefined meta',
						meta: undefined,
					},
				];

				const action = {
					type: RECEIVE_CATEGORIES,
					categories,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);
				const category = state.categoriesBySlug.minimal;

				expect( category.slug ).toBe( 'minimal' );
				expect( category.label ).toBe( 'Minimal' );
				expect( category.description ).toBe(
					'Minimal category with undefined meta'
				);
				// Undefined properties should not be present
				expect( category ).not.toHaveProperty( 'meta' );
			} );
		} );

		describe( 'REGISTER_ABILITY_CATEGORY', () => {
			it( 'should add category to the state', () => {
				const category = {
					slug: 'test-category',
					label: 'Test Category',
					description: 'A test category',
				};

				const action = {
					type: REGISTER_ABILITY_CATEGORY,
					category,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toHaveProperty(
					'test-category'
				);
				expect( state.categoriesBySlug[ 'test-category' ].label ).toBe(
					'Test Category'
				);
			} );

			it( 'should add category with meta to the state', () => {
				const category = {
					slug: 'test-category',
					label: 'Test Category',
					description: 'A test category',
					meta: { color: 'blue', priority: 'high' },
				};

				const action = {
					type: REGISTER_ABILITY_CATEGORY,
					category,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect(
					state.categoriesBySlug[ 'test-category' ].meta
				).toEqual( { color: 'blue', priority: 'high' } );
			} );

			it( 'should filter out extra properties when registering', () => {
				const category = {
					slug: 'test-category',
					label: 'Test Category',
					description: 'A test category',
					// Extra properties that should be filtered out
					_links: { self: { href: '/test' } },
					_embedded: { author: { id: 1 } },
					extra_field: 'should be removed',
				};

				const action = {
					type: REGISTER_ABILITY_CATEGORY,
					category,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);
				const registeredCategory =
					state.categoriesBySlug[ 'test-category' ];

				// Should have valid properties
				expect( registeredCategory.slug ).toBe( 'test-category' );
				expect( registeredCategory.label ).toBe( 'Test Category' );
				expect( registeredCategory.description ).toBe(
					'A test category'
				);

				// Should NOT have invalid properties
				expect( registeredCategory ).not.toHaveProperty( '_links' );
				expect( registeredCategory ).not.toHaveProperty( '_embedded' );
				expect( registeredCategory ).not.toHaveProperty(
					'extra_field'
				);
			} );

			it( 'should replace existing category', () => {
				const initialState = {
					'test-category': {
						slug: 'test-category',
						label: 'Old Label',
						description: 'Old description',
					},
				};

				const category = {
					slug: 'test-category',
					label: 'New Label',
					description: 'New description',
					meta: { color: 'red' },
				};

				const action = {
					type: REGISTER_ABILITY_CATEGORY,
					category,
				};

				const state = reducer(
					{ categoriesBySlug: initialState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug[ 'test-category' ].label ).toBe(
					'New Label'
				);
				expect(
					state.categoriesBySlug[ 'test-category' ].description
				).toBe( 'New description' );
				expect(
					state.categoriesBySlug[ 'test-category' ].meta
				).toEqual( { color: 'red' } );
			} );

			it( 'should handle undefined category', () => {
				const action = {
					type: REGISTER_ABILITY_CATEGORY,
					category: undefined,
				};

				const state = reducer(
					{ categoriesBySlug: defaultState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toEqual( defaultState );
			} );
		} );

		describe( 'UNREGISTER_ABILITY_CATEGORY', () => {
			it( 'should remove category from the state', () => {
				const initialState = {
					category1: {
						slug: 'category1',
						label: 'Category 1',
						description: 'First category',
					},
					category2: {
						slug: 'category2',
						label: 'Category 2',
						description: 'Second category',
					},
				};

				const action = {
					type: UNREGISTER_ABILITY_CATEGORY,
					slug: 'category1',
				};

				const state = reducer(
					{ categoriesBySlug: initialState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).not.toHaveProperty(
					'category1'
				);
				expect( state.categoriesBySlug ).toHaveProperty( 'category2' );
			} );

			it( 'should handle unregistering non-existent category', () => {
				const initialState = {
					'test-category': {
						slug: 'test-category',
						label: 'Test Category',
						description: 'A test category',
					},
				};

				const action = {
					type: UNREGISTER_ABILITY_CATEGORY,
					slug: 'non-existent',
				};

				const state = reducer(
					{ categoriesBySlug: initialState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toEqual( initialState );
			} );

			it( 'should handle undefined slug', () => {
				const initialState = {
					'test-category': {
						slug: 'test-category',
						label: 'Test Category',
						description: 'A test category',
					},
				};

				const action = {
					type: UNREGISTER_ABILITY_CATEGORY,
					slug: undefined,
				};

				const state = reducer(
					{ categoriesBySlug: initialState, abilitiesByName: {} },
					action
				);

				expect( state.categoriesBySlug ).toEqual( initialState );
			} );
		} );
	} );
} );
