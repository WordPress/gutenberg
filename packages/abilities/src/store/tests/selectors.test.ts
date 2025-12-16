/**
 * Tests for store selectors.
 */

/**
 * Internal dependencies
 */
import {
	getAbilities,
	getAbility,
	getAbilityCategories,
	getAbilityCategory,
} from '../selectors';
import type { AbilitiesState } from '../types';

describe( 'Store Selectors', () => {
	describe( 'getAbilities', () => {
		it( 'should return all abilities as an array', () => {
			const state: AbilitiesState = {
				abilitiesByName: {
					'test/ability1': {
						name: 'test/ability1',
						label: 'Test Ability 1',
						description: 'First test ability',
						category: 'test-category',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
					'test/ability2': {
						name: 'test/ability2',
						label: 'Test Ability 2',
						description: 'Second test ability',
						category: 'test-category',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
						callback: jest.fn(),
					},
				},
				categoriesBySlug: {},
			};

			const abilities = getAbilities( state );

			expect( abilities ).toHaveLength( 2 );
			expect( abilities ).toContainEqual(
				state.abilitiesByName[ 'test/ability1' ]
			);
			expect( abilities ).toContainEqual(
				state.abilitiesByName[ 'test/ability2' ]
			);
		} );

		it( 'should return empty array when no abilities exist', () => {
			const state: AbilitiesState = {
				abilitiesByName: {},
				categoriesBySlug: {},
			};

			const abilities = getAbilities( state );

			expect( abilities ).toEqual( [] );
		} );

		it( 'should memoize results when state unchanged', () => {
			const state: AbilitiesState = {
				abilitiesByName: {
					'test/ability': {
						name: 'test/ability',
						label: 'Test Ability',
						description: 'Test ability',
						category: 'test-category',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
				},
				categoriesBySlug: {},
			};

			const result1 = getAbilities( state );
			const result2 = getAbilities( state );

			// Should return the same reference when state unchanged
			expect( result1 ).toBe( result2 );
		} );

		it( 'should return new array reference when state changes', () => {
			const state1: AbilitiesState = {
				abilitiesByName: {
					'test/ability1': {
						name: 'test/ability1',
						label: 'Test Ability 1',
						description: 'Test ability',
						category: 'test-category',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
				},
				categoriesBySlug: {},
			};

			const state2: AbilitiesState = {
				abilitiesByName: {
					...state1.abilitiesByName,
					'test/ability2': {
						name: 'test/ability2',
						label: 'Test Ability 2',
						description: 'Another test ability',
						category: 'test-category',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
				},
				categoriesBySlug: {},
			};

			const result1 = getAbilities( state1 );
			const result2 = getAbilities( state2 );

			// Should return different references when state changes
			expect( result1 ).not.toBe( result2 );
			expect( result1 ).toHaveLength( 1 );
			expect( result2 ).toHaveLength( 2 );
		} );

		it( 'should filter abilities by category when category is provided', () => {
			const state: AbilitiesState = {
				abilitiesByName: {
					'test/ability1': {
						name: 'test/ability1',
						label: 'Test Ability 1',
						description: 'First test ability',
						category: 'data-retrieval',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
					'test/ability2': {
						name: 'test/ability2',
						label: 'Test Ability 2',
						description: 'Second test ability',
						category: 'data-retrieval',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
					'test/ability3': {
						name: 'test/ability3',
						label: 'Test Ability 3',
						description: 'Third test ability',
						category: 'user-management',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
				},
				categoriesBySlug: {},
			};

			const result = getAbilities( state, {
				category: 'data-retrieval',
			} );

			expect( result ).toHaveLength( 2 );
			expect( result ).toContainEqual(
				expect.objectContaining( { name: 'test/ability1' } )
			);
			expect( result ).toContainEqual(
				expect.objectContaining( { name: 'test/ability2' } )
			);
			expect( result ).not.toContainEqual(
				expect.objectContaining( { name: 'test/ability3' } )
			);
		} );

		it( 'should return empty array when no abilities match category', () => {
			const state: AbilitiesState = {
				abilitiesByName: {
					'test/ability1': {
						name: 'test/ability1',
						label: 'Test Ability 1',
						description: 'First test ability',
						category: 'data-retrieval',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
				},
				categoriesBySlug: {},
			};

			const result = getAbilities( state, {
				category: 'non-existent-category',
			} );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getAbility', () => {
		const state: AbilitiesState = {
			abilitiesByName: {
				'test/ability1': {
					name: 'test/ability1',
					label: 'Test Ability 1',
					description: 'First test ability',
					category: 'test-category',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
				'test/ability2': {
					name: 'test/ability2',
					label: 'Test Ability 2',
					description: 'Second test ability',
					category: 'test-category',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
					callback: jest.fn(),
				},
			},
			categoriesBySlug: {},
		};

		it( 'should return a specific ability by name', () => {
			const ability = getAbility( state, 'test/ability1' );

			expect( ability ).toEqual(
				state.abilitiesByName[ 'test/ability1' ]
			);
		} );

		it( 'should return null if ability not found', () => {
			const ability = getAbility( state, 'non-existent' );

			expect( ability ).toBeUndefined();
		} );

		it( 'should handle empty state', () => {
			const emptyState: AbilitiesState = {
				abilitiesByName: {},
				categoriesBySlug: {},
			};

			const ability = getAbility( emptyState, 'test/ability' );

			expect( ability ).toBeUndefined();
		} );

		it( 'should return client abilities with callbacks', () => {
			const ability = getAbility( state, 'test/ability2' );

			expect( ability ).toEqual(
				state.abilitiesByName[ 'test/ability2' ]
			);
			expect( ability?.callback ).toBeDefined();
		} );

		it( 'should handle valid namespaced ability names correctly', () => {
			const stateWithNamespaced: AbilitiesState = {
				abilitiesByName: {
					'my-plugin/feature-action': {
						name: 'my-plugin/feature-action',
						label: 'Namespaced Action',
						description: 'Namespaced ability',
						category: 'test-category',
						input_schema: { type: 'object' },
						output_schema: { type: 'object' },
					},
				},
				categoriesBySlug: {},
			};

			const ability = getAbility(
				stateWithNamespaced,
				'my-plugin/feature-action'
			);

			expect( ability ).toEqual(
				stateWithNamespaced.abilitiesByName[
					'my-plugin/feature-action'
				]
			);
		} );
	} );

	describe( 'getAbilityCategories', () => {
		it( 'should return all categories as an array', () => {
			const state: AbilitiesState = {
				abilitiesByName: {},
				categoriesBySlug: {
					'data-retrieval': {
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'Abilities that retrieve data',
					},
					'user-management': {
						slug: 'user-management',
						label: 'User Management',
						description: 'Abilities for managing users',
					},
				},
			};

			const categories = getAbilityCategories( state );

			expect( categories ).toHaveLength( 2 );
			expect( categories ).toContainEqual(
				state.categoriesBySlug[ 'data-retrieval' ]
			);
			expect( categories ).toContainEqual(
				state.categoriesBySlug[ 'user-management' ]
			);
		} );

		it( 'should return empty array when no categories exist', () => {
			const state: AbilitiesState = {
				abilitiesByName: {},
				categoriesBySlug: {},
			};

			const categories = getAbilityCategories( state );

			expect( categories ).toEqual( [] );
		} );
	} );

	describe( 'getAbilityCategory', () => {
		const state: AbilitiesState = {
			abilitiesByName: {},
			categoriesBySlug: {
				'data-retrieval': {
					slug: 'data-retrieval',
					label: 'Data Retrieval',
					description: 'Abilities that retrieve data',
				},
				'user-management': {
					slug: 'user-management',
					label: 'User Management',
					description: 'Abilities for managing users',
					meta: {
						priority: 'high',
					},
				},
			},
		};

		it( 'should return a specific category by slug', () => {
			const category = getAbilityCategory( state, 'data-retrieval' );

			expect( category ).toEqual(
				state.categoriesBySlug[ 'data-retrieval' ]
			);
		} );

		it( 'should return null if category not found', () => {
			const category = getAbilityCategory( state, 'non-existent' );

			expect( category ).toBeUndefined();
		} );

		it( 'should handle empty state', () => {
			const emptyState: AbilitiesState = {
				abilitiesByName: {},
				categoriesBySlug: {},
			};

			const category = getAbilityCategory( emptyState, 'data-retrieval' );

			expect( category ).toBeUndefined();
		} );

		it( 'should return categories with meta', () => {
			const category = getAbilityCategory( state, 'user-management' );

			expect( category ).toEqual(
				state.categoriesBySlug[ 'user-management' ]
			);
			expect( category?.meta ).toBeDefined();
			expect( category?.meta?.priority ).toBe( 'high' );
		} );

		it( 'should handle valid category slug formats', () => {
			const stateWithVariousSlugs: AbilitiesState = {
				abilitiesByName: {},
				categoriesBySlug: {
					simple: {
						slug: 'simple',
						label: 'Simple',
						description: 'Simple slug',
					},
					'with-dashes': {
						slug: 'with-dashes',
						label: 'With Dashes',
						description: 'Slug with dashes',
					},
					with123: {
						slug: 'with123',
						label: 'With Numbers',
						description: 'Slug with numbers',
					},
				},
			};

			expect(
				getAbilityCategory( stateWithVariousSlugs, 'simple' )
			).toEqual( stateWithVariousSlugs.categoriesBySlug.simple );
			expect(
				getAbilityCategory( stateWithVariousSlugs, 'with-dashes' )
			).toEqual(
				stateWithVariousSlugs.categoriesBySlug[ 'with-dashes' ]
			);
			expect(
				getAbilityCategory( stateWithVariousSlugs, 'with123' )
			).toEqual( stateWithVariousSlugs.categoriesBySlug.with123 );
		} );
	} );
} );
