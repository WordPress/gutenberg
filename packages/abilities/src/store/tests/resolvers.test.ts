/**
 * Tests for store resolvers.
 */

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	getAbilities,
	getAbility,
	getAbilityCategories,
	getAbilityCategory,
} from '../resolvers';
import { receiveAbilities, receiveCategories } from '../actions';
import { ENTITY_KIND, ENTITY_NAME, ENTITY_NAME_CATEGORIES } from '../constants';
import type { Ability, AbilityCategory } from '../../types';

// Mock the WordPress core data store
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

describe( 'Store Resolvers', () => {
	let mockDispatch: jest.Mock;
	let mockRegistry: any;
	let mockSelect: any;

	beforeEach( () => {
		mockDispatch = jest.fn();
		mockSelect = jest.fn();
		mockRegistry = {
			resolveSelect: jest.fn(),
			select: jest.fn(),
		};
	} );

	describe( 'getAbilities', () => {
		it( 'should fetch and dispatch abilities from the server', async () => {
			const mockAbilities: Ability[] = [
				{
					name: 'test/ability1',
					label: 'Test Ability 1',
					description: 'First test ability',
					category: 'test-category',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
			];

			const mockResolveSelect = {
				getEntityRecords: jest.fn().mockResolvedValue( mockAbilities ),
			};

			const mockSelectInstance = {
				getAbilities: jest.fn().mockReturnValue( [] ), // Store is empty
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilities();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			expect( mockRegistry.resolveSelect ).toHaveBeenCalledWith(
				coreStore
			);
			expect( mockResolveSelect.getEntityRecords ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME,
				{ per_page: -1 }
			);
			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveAbilities( mockAbilities )
			);
		} );

		it( 'should not fetch if store already has abilities', async () => {
			const existingAbilities: Ability[] = [
				{
					name: 'test/ability1',
					label: 'Test Ability 1',
					description: 'First test ability',
					category: 'data-retrieval',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
			];

			const mockResolveSelect = {
				getEntityRecords: jest.fn(),
			};

			const mockSelectInstance = {
				getAbilities: jest.fn().mockReturnValue( existingAbilities ), // Store has data
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilities( { category: 'data-retrieval' } );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			// Should not fetch since store already has abilities
			expect( mockResolveSelect.getEntityRecords ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should handle empty abilities', async () => {
			const mockResolveSelect = {
				getEntityRecords: jest.fn().mockResolvedValue( [] ),
			};

			const mockSelectInstance = {
				getAbilities: jest.fn().mockReturnValue( [] ), // Store is empty
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilities();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveAbilities( [] )
			);
		} );

		it( 'should handle null response', async () => {
			const mockResolveSelect = {
				getEntityRecords: jest.fn().mockResolvedValue( null ),
			};

			const mockSelectInstance = {
				getAbilities: jest.fn().mockReturnValue( [] ), // Store is empty
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilities();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveAbilities( [] )
			);
		} );

		it( 'should fetch all abilities in a single request', async () => {
			const allAbilities: Ability[] = [
				{
					name: 'test/ability1',
					label: 'Test Ability 1',
					description: 'First test ability',
					category: 'test-category',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
				{
					name: 'test/ability2',
					label: 'Test Ability 2',
					description: 'Second test ability',
					category: 'test-category',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
				{
					name: 'test/ability3',
					label: 'Test Ability 3',
					description: 'Third test ability',
					category: 'test-category',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
			];

			const mockResolveSelect = {
				getEntityRecords: jest.fn().mockResolvedValue( allAbilities ),
			};

			const mockSelectInstance = {
				getAbilities: jest.fn().mockReturnValue( [] ), // Store is empty
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilities();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			// Should fetch all abilities in one request with per_page: -1
			expect( mockResolveSelect.getEntityRecords ).toHaveBeenCalledTimes(
				1
			);
			expect(
				mockResolveSelect.getEntityRecords
			).toHaveBeenNthCalledWith( 1, ENTITY_KIND, ENTITY_NAME, {
				per_page: -1,
			} );

			// Should dispatch all abilities
			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveAbilities( allAbilities )
			);
		} );
	} );

	describe( 'getAbility', () => {
		it( 'should fetch and dispatch a specific ability', async () => {
			const mockAbility: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test ability description',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const mockResolveSelect = {
				getEntityRecord: jest.fn().mockResolvedValue( mockAbility ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );
			mockSelect.getAbility = jest.fn().mockReturnValue( null ); // Ability not in store

			const resolver = getAbility( 'test/ability' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockSelect.getAbility ).toHaveBeenCalledWith(
				'test/ability'
			);
			expect( mockRegistry.resolveSelect ).toHaveBeenCalledWith(
				coreStore
			);
			expect( mockResolveSelect.getEntityRecord ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME,
				'test/ability'
			);
			// registerAbility returns a thunk, so we just verify dispatch was called
			expect( mockDispatch ).toHaveBeenCalled();
			expect( typeof mockDispatch.mock.calls[ 0 ][ 0 ] ).toBe(
				'function'
			);
		} );

		it( 'should not fetch if ability already exists in store', async () => {
			const existingAbility: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Already in store',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: jest.fn(),
			};

			mockSelect.getAbility = jest
				.fn()
				.mockReturnValue( existingAbility );

			const resolver = getAbility( 'test/ability' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockSelect.getAbility ).toHaveBeenCalledWith(
				'test/ability'
			);
			expect( mockRegistry.resolveSelect ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should handle non-existent abilities', async () => {
			const mockResolveSelect = {
				getEntityRecord: jest.fn().mockResolvedValue( null ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );
			mockSelect.getAbility = jest.fn().mockReturnValue( null );

			const resolver = getAbility( 'non-existent' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockResolveSelect.getEntityRecord ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME,
				'non-existent'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should handle valid namespaced ability names', async () => {
			const mockAbility: Ability = {
				name: 'my-plugin/feature-action',
				label: 'Namespaced Action',
				description: 'Namespaced ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const mockResolveSelect = {
				getEntityRecord: jest.fn().mockResolvedValue( mockAbility ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );
			mockSelect.getAbility = jest.fn().mockReturnValue( null );

			const resolver = getAbility( 'my-plugin/feature-action' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockResolveSelect.getEntityRecord ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME,
				'my-plugin/feature-action'
			);
			// registerAbility returns a thunk, so we just verify dispatch was called
			expect( mockDispatch ).toHaveBeenCalled();
			expect( typeof mockDispatch.mock.calls[ 0 ][ 0 ] ).toBe(
				'function'
			);
		} );
	} );

	describe( 'getAbilityCategories', () => {
		it( 'should fetch and dispatch categories from the server', async () => {
			const mockCategories: AbilityCategory[] = [
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

			const mockResolveSelect = {
				getEntityRecords: jest.fn().mockResolvedValue( mockCategories ),
			};

			const mockSelectInstance = {
				getAbilityCategories: jest.fn().mockReturnValue( [] ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilityCategories();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			expect( mockRegistry.resolveSelect ).toHaveBeenCalledWith(
				coreStore
			);
			expect( mockResolveSelect.getEntityRecords ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME_CATEGORIES,
				{ per_page: -1 }
			);
			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveCategories( mockCategories )
			);
		} );

		it( 'should not fetch if store already has categories', async () => {
			const existingCategories: AbilityCategory[] = [
				{
					slug: 'data-retrieval',
					label: 'Data Retrieval',
					description: 'Abilities that retrieve data',
				},
			];

			const mockResolveSelect = {
				getEntityRecords: jest.fn(),
			};

			const mockSelectInstance = {
				getAbilityCategories: jest
					.fn()
					.mockReturnValue( existingCategories ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilityCategories();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			// Should not fetch since store already has categories
			expect( mockResolveSelect.getEntityRecords ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should fetch from server even when only client-registered categories exist', async () => {
			// This tests the scenario where a client category is registered first
			// The resolver should still fetch server categories
			const clientOnlyCategories: AbilityCategory[] = [
				{
					slug: 'client-category',
					label: 'Client Category',
					description: 'A category registered on the client',
					meta: {
						_clientRegistered: true,
					},
				},
			];

			const serverCategories: AbilityCategory[] = [
				{
					slug: 'data-retrieval',
					label: 'Data Retrieval',
					description: 'Server category',
				},
				{
					slug: 'user-management',
					label: 'User Management',
					description: 'Another server category',
				},
			];

			const mockResolveSelect = {
				getEntityRecords: jest
					.fn()
					.mockResolvedValue( serverCategories ),
			};

			const mockSelectInstance = {
				getAbilityCategories: jest
					.fn()
					.mockReturnValue( clientOnlyCategories ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilityCategories();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			// Should fetch from server because only client categories exist
			expect( mockRegistry.resolveSelect ).toHaveBeenCalledWith(
				coreStore
			);
			expect( mockResolveSelect.getEntityRecords ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME_CATEGORIES,
				{ per_page: -1 }
			);
			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveCategories( serverCategories )
			);
		} );

		it( 'should handle null response', async () => {
			const mockResolveSelect = {
				getEntityRecords: jest.fn().mockResolvedValue( null ),
			};

			const mockSelectInstance = {
				getAbilityCategories: jest.fn().mockReturnValue( [] ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );

			const resolver = getAbilityCategories();
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelectInstance,
			} );

			expect( mockDispatch ).toHaveBeenCalledWith(
				receiveCategories( [] )
			);
		} );
	} );

	describe( 'getAbilityCategory', () => {
		it( 'should fetch and dispatch a specific category', async () => {
			const mockCategory: AbilityCategory = {
				slug: 'data-retrieval',
				label: 'Data Retrieval',
				description: 'Abilities that retrieve data',
			};

			const mockResolveSelect = {
				getEntityRecord: jest.fn().mockResolvedValue( mockCategory ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );
			mockSelect.getAbilityCategory = jest.fn().mockReturnValue( null );

			const resolver = getAbilityCategory( 'data-retrieval' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockSelect.getAbilityCategory ).toHaveBeenCalledWith(
				'data-retrieval'
			);
			expect( mockRegistry.resolveSelect ).toHaveBeenCalledWith(
				coreStore
			);
			expect( mockResolveSelect.getEntityRecord ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME_CATEGORIES,
				'data-retrieval'
			);
			// registerAbilityCategory returns a thunk, so we just verify dispatch was called
			expect( mockDispatch ).toHaveBeenCalled();
			expect( typeof mockDispatch.mock.calls[ 0 ][ 0 ] ).toBe(
				'function'
			);
		} );

		it( 'should not fetch if category already exists in store', async () => {
			const existingCategory: AbilityCategory = {
				slug: 'data-retrieval',
				label: 'Data Retrieval',
				description: 'Already in store',
			};

			mockSelect.getAbilityCategory = jest
				.fn()
				.mockReturnValue( existingCategory );

			const resolver = getAbilityCategory( 'data-retrieval' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockSelect.getAbilityCategory ).toHaveBeenCalledWith(
				'data-retrieval'
			);
			expect( mockRegistry.resolveSelect ).not.toHaveBeenCalled();
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should handle non-existent categories', async () => {
			const mockResolveSelect = {
				getEntityRecord: jest.fn().mockResolvedValue( null ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );
			mockSelect.getAbilityCategory = jest.fn().mockReturnValue( null );

			const resolver = getAbilityCategory( 'non-existent' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			expect( mockResolveSelect.getEntityRecord ).toHaveBeenCalledWith(
				ENTITY_KIND,
				ENTITY_NAME_CATEGORIES,
				'non-existent'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should handle categories with meta', async () => {
			const mockCategory: AbilityCategory = {
				slug: 'user-management',
				label: 'User Management',
				description: 'Abilities for managing users',
				meta: {
					priority: 'high',
				},
			};

			const mockResolveSelect = {
				getEntityRecord: jest.fn().mockResolvedValue( mockCategory ),
			};

			mockRegistry.resolveSelect.mockReturnValue( mockResolveSelect );
			mockSelect.getAbilityCategory = jest.fn().mockReturnValue( null );

			const resolver = getAbilityCategory( 'user-management' );
			await resolver( {
				dispatch: mockDispatch,
				registry: mockRegistry,
				select: mockSelect,
			} );

			// registerAbilityCategory returns a thunk, so we just verify dispatch was called
			expect( mockDispatch ).toHaveBeenCalled();
			expect( typeof mockDispatch.mock.calls[ 0 ][ 0 ] ).toBe(
				'function'
			);
		} );
	} );
} );
