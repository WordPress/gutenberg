/**
 * Tests for store reducer.
 */

/**
 * Internal dependencies
 */
import reducer from '../reducer';
import {
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
} from '../constants';

describe( 'Store Reducer', () => {
	describe( 'abilitiesByName', () => {
		const defaultState = {};

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
		} );
	} );

	describe( 'categoriesBySlug', () => {
		const defaultState = {};

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
