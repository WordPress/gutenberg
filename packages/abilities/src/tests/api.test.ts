/**
 * Tests for API functions.
 */

/**
 * WordPress dependencies
 */
import { dispatch, select, resolveSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	getAbilities,
	getAbility,
	getAbilityCategories,
	getAbilityCategory,
	registerAbility,
	unregisterAbility,
	executeAbility,
} from '../api';
import { store } from '../store';
import type { Ability, AbilityCategory } from '../types';

// Mock WordPress dependencies
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	select: jest.fn(),
	resolveSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/api-fetch' );

jest.mock( '../store', () => ( {
	store: 'abilities-api/store',
} ) );

describe( 'API functions', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'getAbilities', () => {
		it( 'should resolve and return all abilities from the store', async () => {
			const mockAbilities: Ability[] = [
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
			];

			const mockGetAbilities = jest
				.fn()
				.mockResolvedValue( mockAbilities );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilities: mockGetAbilities,
			} );

			const result = await getAbilities();

			expect( resolveSelect ).toHaveBeenCalledWith( store );
			expect( mockGetAbilities ).toHaveBeenCalled();
			expect( result ).toEqual( mockAbilities );
		} );

		it( 'should pass category parameter to store when filtering', async () => {
			const mockAbilities: Ability[] = [
				{
					name: 'test/ability1',
					label: 'Test Ability 1',
					description: 'First test ability',
					category: 'data-retrieval',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
				{
					name: 'test/ability2',
					label: 'Test Ability 2',
					description: 'Second test ability',
					category: 'data-retrieval',
					input_schema: { type: 'object' },
					output_schema: { type: 'object' },
				},
			];

			const mockGetAbilities = jest
				.fn()
				.mockResolvedValue( mockAbilities );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilities: mockGetAbilities,
			} );

			const result = await getAbilities( { category: 'data-retrieval' } );

			expect( resolveSelect ).toHaveBeenCalledWith( store );
			expect( mockGetAbilities ).toHaveBeenCalledWith( {
				category: 'data-retrieval',
			} );
			expect( result ).toEqual( mockAbilities );
		} );
	} );

	describe( 'getAbility', () => {
		it( 'should return a specific ability by name', async () => {
			const mockAbility: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test ability description',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const result = await getAbility( 'test/ability' );

			expect( resolveSelect ).toHaveBeenCalledWith( store );
			expect( mockGetAbility ).toHaveBeenCalledWith( 'test/ability' );
			expect( result ).toEqual( mockAbility );
		} );

		it( 'should return null if ability not found', async () => {
			const mockGetAbility = jest.fn().mockResolvedValue( null );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const result = await getAbility( 'non-existent' );

			expect( mockGetAbility ).toHaveBeenCalledWith( 'non-existent' );
			expect( result ).toBeNull();
		} );
	} );

	describe( 'registerAbility', () => {
		it( 'should register a client-side ability with a callback', () => {
			const mockRegisterAbility = jest.fn();
			( dispatch as jest.Mock ).mockReturnValue( {
				registerAbility: mockRegisterAbility,
			} );

			// Mock select to return no existing ability
			( select as jest.Mock ).mockReturnValue( {
				getAbility: jest.fn().mockReturnValue( null ),
			} );

			const ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: jest.fn(),
			};

			registerAbility( ability );

			expect( dispatch ).toHaveBeenCalledWith( store );
			expect( mockRegisterAbility ).toHaveBeenCalledWith( ability );
		} );
	} );

	describe( 'unregisterAbility', () => {
		it( 'should unregister an ability', () => {
			const mockUnregisterAbility = jest.fn();
			( dispatch as jest.Mock ).mockReturnValue( {
				unregisterAbility: mockUnregisterAbility,
			} );

			unregisterAbility( 'test/ability' );

			expect( dispatch ).toHaveBeenCalledWith( store );
			expect( mockUnregisterAbility ).toHaveBeenCalledWith(
				'test/ability'
			);
		} );
	} );

	describe( 'executeAbility', () => {
		it( 'should execute a server-side ability via API', async () => {
			const mockAbility: Ability = {
				name: 'test/server-ability',
				label: 'Server Ability',
				description: 'Test server ability',
				category: 'test-category',
				input_schema: {
					type: 'object',
					properties: {
						message: { type: 'string' },
					},
					required: [ 'message' ],
				},
				output_schema: { type: 'object' },
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const mockResponse = { success: true, result: 'test' };
			( apiFetch as unknown as jest.Mock ).mockResolvedValue(
				mockResponse
			);

			const input = { message: 'Hello' };
			const result = await executeAbility( 'test/server-ability', input );

			expect( mockGetAbility ).toHaveBeenCalledWith(
				'test/server-ability'
			);
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp-abilities/v1/abilities/test/server-ability/run',
				method: 'POST',
				data: { input },
			} );
			expect( result ).toEqual( mockResponse );
		} );

		it( 'should execute a client-side ability locally', async () => {
			const mockCallback = jest
				.fn()
				.mockResolvedValue( { success: true } );
			const mockAbility: Ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: mockCallback,
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const input = { test: 'data' };
			const result = await executeAbility( 'test/client-ability', input );

			expect( mockGetAbility ).toHaveBeenCalledWith(
				'test/client-ability'
			);
			expect( mockCallback ).toHaveBeenCalledWith( input );
			expect( apiFetch ).not.toHaveBeenCalled();
			expect( result ).toEqual( { success: true } );
		} );

		it( 'should throw error if ability not found', async () => {
			const mockGetAbility = jest.fn().mockResolvedValue( null );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'non-existent', {} )
			).rejects.toThrow( 'Ability not found: non-existent' );
		} );

		it( 'should validate input for client abilities', async () => {
			const mockCallback = jest.fn();
			const mockAbility: Ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: {
					type: 'object',
					properties: {
						message: { type: 'string' },
					},
					required: [ 'message' ],
				},
				output_schema: { type: 'object' },
				callback: mockCallback,
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/client-ability', {} )
			).rejects.toThrow( 'invalid input' );
		} );

		it( 'should execute a read-only ability via GET', async () => {
			const mockAbility: Ability = {
				name: 'test/read-only',
				label: 'Read-only Ability',
				description: 'Test read-only ability.',
				category: 'test-category',
				input_schema: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						format: { type: 'string' },
					},
				},
				output_schema: { type: 'object' },
				meta: {
					annotations: { readonly: true },
				},
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const mockResponse = { data: 'read-only data' };
			( apiFetch as unknown as jest.Mock ).mockResolvedValue(
				mockResponse
			);

			const input = { id: '123', format: 'json' };
			const result = await executeAbility( 'test/read-only', input );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp-abilities/v1/abilities/test/read-only/run?input%5Bid%5D=123&input%5Bformat%5D=json',
				method: 'GET',
			} );
			expect( result ).toEqual( mockResponse );
		} );

		it( 'should execute a read-only ability with empty input', async () => {
			const mockAbility: Ability = {
				name: 'test/read-only',
				label: 'Read-only Ability',
				description: 'Test read-only ability.',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				meta: {
					annotations: { readonly: true },
				},
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const mockResponse = { data: 'read-only data' };
			( apiFetch as unknown as jest.Mock ).mockResolvedValue(
				mockResponse
			);

			const result = await executeAbility( 'test/read-only', {} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp-abilities/v1/abilities/test/read-only/run?',
				method: 'GET',
			} );
			expect( result ).toEqual( mockResponse );
		} );

		it( 'should execute a destructive idempotent ability via DELETE', async () => {
			const mockAbility: Ability = {
				name: 'test/destructive',
				label: 'Destructive Ability',
				description: 'Test destructive idempotent ability.',
				category: 'test-category',
				input_schema: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						format: { type: 'string' },
					},
				},
				output_schema: { type: 'string' },
				meta: {
					annotations: {
						destructive: true,
						idempotent: true,
					},
				},
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const mockResponse = 'Item deleted successfully.';
			( apiFetch as unknown as jest.Mock ).mockResolvedValue(
				mockResponse
			);

			const input = { id: '123', format: 'json' };
			const result = await executeAbility( 'test/destructive', input );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp-abilities/v1/abilities/test/destructive/run?input%5Bid%5D=123&input%5Bformat%5D=json',
				method: 'DELETE',
			} );
			expect( result ).toEqual( mockResponse );
		} );

		it( 'should handle errors in client ability execution', async () => {
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation();
			const executionError = new Error( 'Execution failed' );
			const mockCallback = jest.fn().mockRejectedValue( executionError );

			const mockAbility: Ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: mockCallback,
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/client-ability', {} )
			).rejects.toThrow( 'Execution failed' );

			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Error executing client ability test/client-ability:',
				executionError
			);

			consoleErrorSpy.mockRestore();
		} );

		it( 'should handle errors in server ability execution', async () => {
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation();
			const apiError = new Error( 'API request failed' );

			const mockAbility: Ability = {
				name: 'test/server-ability',
				label: 'Server Ability',
				description: 'Test server ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			( apiFetch as unknown as jest.Mock ).mockRejectedValue( apiError );

			await expect(
				executeAbility( 'test/server-ability', {} )
			).rejects.toThrow( 'API request failed' );

			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Error executing ability test/server-ability:',
				apiError
			);

			consoleErrorSpy.mockRestore();
		} );

		it( 'should execute ability without callback as server ability', async () => {
			const mockAbility: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test ability without callback',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				// No callback - should execute as server ability
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			const mockResponse = { success: true };
			( apiFetch as unknown as jest.Mock ).mockResolvedValue(
				mockResponse
			);

			const result = await executeAbility( 'test/ability', {
				data: 'test',
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp-abilities/v1/abilities/test/ability/run',
				method: 'POST',
				data: { input: { data: 'test' } },
			} );
			expect( result ).toEqual( mockResponse );
		} );

		it( 'should validate output for client abilities', async () => {
			const mockCallback = jest
				.fn()
				.mockResolvedValue( { invalid: 'response' } );
			const mockAbility: Ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: {
					type: 'object',
					properties: {
						result: { type: 'string' },
					},
					required: [ 'result' ],
				},
				callback: mockCallback,
			};

			const mockGetAbility = jest.fn().mockResolvedValue( mockAbility );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/client-ability', {} )
			).rejects.toThrow( 'invalid output' );
		} );
	} );

	describe( 'getAbilityCategories', () => {
		it( 'should resolve and return all categories from the store', async () => {
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

			const mockGetAbilityCategories = jest
				.fn()
				.mockResolvedValue( mockCategories );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: mockGetAbilityCategories,
			} );

			const result = await getAbilityCategories();

			expect( resolveSelect ).toHaveBeenCalledWith( store );
			expect( mockGetAbilityCategories ).toHaveBeenCalled();
			expect( result ).toEqual( mockCategories );
		} );

		it( 'should return empty array when no categories exist', async () => {
			const mockGetAbilityCategories = jest.fn().mockResolvedValue( [] );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: mockGetAbilityCategories,
			} );

			const result = await getAbilityCategories();

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getAbilityCategory', () => {
		it( 'should return a specific category by slug', async () => {
			const mockCategory: AbilityCategory = {
				slug: 'data-retrieval',
				label: 'Data Retrieval',
				description: 'Abilities that retrieve data',
			};

			const mockGetAbilityCategory = jest
				.fn()
				.mockResolvedValue( mockCategory );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategory: mockGetAbilityCategory,
			} );

			const result = await getAbilityCategory( 'data-retrieval' );

			expect( resolveSelect ).toHaveBeenCalledWith( store );
			expect( mockGetAbilityCategory ).toHaveBeenCalledWith(
				'data-retrieval'
			);
			expect( result ).toEqual( mockCategory );
		} );

		it( 'should return null if category not found', async () => {
			const mockGetAbilityCategory = jest.fn().mockResolvedValue( null );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategory: mockGetAbilityCategory,
			} );

			const result = await getAbilityCategory( 'non-existent' );

			expect( mockGetAbilityCategory ).toHaveBeenCalledWith(
				'non-existent'
			);
			expect( result ).toBeNull();
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

			const mockGetAbilityCategory = jest
				.fn()
				.mockResolvedValue( mockCategory );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategory: mockGetAbilityCategory,
			} );

			const result = await getAbilityCategory( 'user-management' );

			expect( result ).toEqual( mockCategory );
			expect( result?.meta ).toBeDefined();
			expect( result?.meta?.priority ).toBe( 'high' );
		} );
	} );
} );
