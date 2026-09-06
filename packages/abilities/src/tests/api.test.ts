/**
 * Tests for API functions.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { dispatch, select } from '@wordpress/data';
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

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	select: vi.fn(),
	dispatch: vi.fn(),
} ) );

vi.mock( import( '../store' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	store: 'abilities-api/store' as unknown as typeof store,
} ) );

type AbilitySelectors = ReturnType< typeof select< typeof store > >;
type AbilityDispatch = ReturnType< typeof dispatch< typeof store > >;
const mockedSelect = vi.mocked( select ) as Mock<
	( storeDescriptor: typeof store ) => AbilitySelectors
>;
const mockedDispatch = vi.mocked( dispatch ) as Mock<
	( storeDescriptor: typeof store ) => AbilityDispatch
>;

const mockSelect = ( selectors: Partial< AbilitySelectors > ) => {
	mockedSelect.mockReturnValue( selectors as AbilitySelectors );
};

const mockDispatch = ( actions: Partial< AbilityDispatch > ) => {
	mockedDispatch.mockReturnValue( actions as AbilityDispatch );
};

describe( 'API functions', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	describe( 'getAbilities', () => {
		it( 'should return all abilities from the store', () => {
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

			const mockGetAbilities = vi.fn().mockReturnValue( mockAbilities );
			mockSelect( {
				getAbilities: mockGetAbilities,
			} );

			const result = getAbilities();

			expect( select ).toHaveBeenCalledWith( store );
			expect( mockGetAbilities ).toHaveBeenCalled();
			expect( result ).toEqual( mockAbilities );
		} );

		it( 'should pass category parameter to store when filtering', () => {
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

			const mockGetAbilities = vi.fn().mockReturnValue( mockAbilities );
			mockSelect( {
				getAbilities: mockGetAbilities,
			} );

			const result = getAbilities( { category: 'data-retrieval' } );

			expect( select ).toHaveBeenCalledWith( store );
			expect( mockGetAbilities ).toHaveBeenCalledWith( {
				category: 'data-retrieval',
			} );
			expect( result ).toEqual( mockAbilities );
		} );
	} );

	describe( 'getAbility', () => {
		it( 'should return a specific ability by name', () => {
			const mockAbility: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test ability description',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const result = getAbility( 'test/ability' );

			expect( select ).toHaveBeenCalledWith( store );
			expect( mockGetAbility ).toHaveBeenCalledWith( 'test/ability' );
			expect( result ).toEqual( mockAbility );
		} );
	} );

	describe( 'registerAbility', () => {
		it( 'should register a client-side ability with a callback', () => {
			const mockRegisterAbility = vi.fn();
			mockDispatch( {
				registerAbility: mockRegisterAbility,
			} );

			// Mock select to return no existing ability
			mockSelect( {
				getAbility: vi.fn().mockReturnValue( null ),
			} );

			const ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: vi.fn(),
			};

			registerAbility( ability );

			expect( dispatch ).toHaveBeenCalledWith( store );
			expect( mockRegisterAbility ).toHaveBeenCalledWith( ability );
		} );
	} );

	describe( 'unregisterAbility', () => {
		it( 'should unregister an ability', () => {
			const mockUnregisterAbility = vi.fn();
			mockDispatch( {
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
		it( 'should execute a server-side ability via callback', async () => {
			const mockServerCallback = vi
				.fn()
				.mockResolvedValue( { success: true, result: 'test' } );
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
				callback: mockServerCallback,
				meta: { annotations: { serverRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const input = { message: 'Hello' };
			const result = await executeAbility( 'test/server-ability', input );

			expect( mockGetAbility ).toHaveBeenCalledWith(
				'test/server-ability'
			);
			expect( mockServerCallback ).toHaveBeenCalledWith( input );
			expect( result ).toEqual( { success: true, result: 'test' } );
		} );

		it( 'should execute a client-side ability locally', async () => {
			const mockCallback = vi.fn().mockResolvedValue( { success: true } );
			const mockAbility: Ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: mockCallback,
				meta: { annotations: { clientRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const input = { test: 'data' };
			const result = await executeAbility( 'test/client-ability', input );

			expect( mockGetAbility ).toHaveBeenCalledWith(
				'test/client-ability'
			);
			expect( mockCallback ).toHaveBeenCalledWith( input );
			expect( result ).toEqual( { success: true } );
		} );

		it( 'should throw error if ability not found', async () => {
			const mockGetAbility = vi.fn().mockReturnValue( null );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'non-existent', {} )
			).rejects.toThrow( 'Ability not found: non-existent' );
		} );

		it( 'should validate input for client abilities', async () => {
			const mockCallback = vi.fn();
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
				meta: { annotations: { clientRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/client-ability', {} )
			).rejects.toThrow( 'invalid input' );
		} );

		it( 'should execute a read-only server ability', async () => {
			const mockServerCallback = vi
				.fn()
				.mockResolvedValue( { data: 'read-only data' } );
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
					annotations: { serverRegistered: true, readonly: true },
				},
				callback: mockServerCallback,
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const input = { id: '123', format: 'json' };
			const result = await executeAbility( 'test/read-only', input );

			expect( mockServerCallback ).toHaveBeenCalledWith( input );
			expect( result ).toEqual( { data: 'read-only data' } );
		} );

		it( 'should execute a read-only ability with empty input', async () => {
			const mockServerCallback = vi
				.fn()
				.mockResolvedValue( { data: 'read-only data' } );
			const mockAbility: Ability = {
				name: 'test/read-only',
				label: 'Read-only Ability',
				description: 'Test read-only ability.',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				meta: {
					annotations: { serverRegistered: true, readonly: true },
				},
				callback: mockServerCallback,
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const result = await executeAbility( 'test/read-only', {} );

			expect( mockServerCallback ).toHaveBeenCalledWith( {} );
			expect( result ).toEqual( { data: 'read-only data' } );
		} );

		it( 'should execute a destructive idempotent server ability', async () => {
			const mockServerCallback = vi
				.fn()
				.mockResolvedValue( 'Item deleted successfully.' );
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
						serverRegistered: true,
						destructive: true,
						idempotent: true,
					},
				},
				callback: mockServerCallback,
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const input = { id: '123', format: 'json' };
			const result = await executeAbility( 'test/destructive', input );

			expect( mockServerCallback ).toHaveBeenCalledWith( input );
			expect( result ).toEqual( 'Item deleted successfully.' );
		} );

		it( 'should handle errors in client ability execution', async () => {
			const consoleErrorSpy = vi
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );
			const executionError = new Error( 'Execution failed' );
			const mockCallback = vi.fn().mockRejectedValue( executionError );

			const mockAbility: Ability = {
				name: 'test/client-ability',
				label: 'Client Ability',
				description: 'Test client ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: mockCallback,
				meta: { annotations: { clientRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/client-ability', {} )
			).rejects.toThrow( 'Execution failed' );

			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Error executing ability test/client-ability:',
				executionError
			);

			consoleErrorSpy.mockRestore();
		} );

		it( 'should handle errors in server ability execution', async () => {
			const consoleErrorSpy = vi
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );
			const serverError = new Error( 'Server execution failed' );
			const mockServerCallback = vi.fn().mockRejectedValue( serverError );

			const mockAbility: Ability = {
				name: 'test/server-ability',
				label: 'Server Ability',
				description: 'Test server ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				callback: mockServerCallback,
				meta: { annotations: { serverRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/server-ability', {} )
			).rejects.toThrow( 'Server execution failed' );

			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Error executing ability test/server-ability:',
				serverError
			);

			consoleErrorSpy.mockRestore();
		} );

		it( 'should execute ability without callback as server ability', async () => {
			const mockServerCallback = vi
				.fn()
				.mockResolvedValue( { success: true } );
			const mockAbility: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test ability without callback',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
				// Server ability - should execute without client validation
				callback: mockServerCallback,
				meta: { annotations: { serverRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			const result = await executeAbility( 'test/ability', {
				data: 'test',
			} );

			expect( mockServerCallback ).toHaveBeenCalledWith( {
				data: 'test',
			} );
			expect( result ).toEqual( { success: true } );
		} );

		it( 'should validate output for client abilities', async () => {
			const mockCallback = vi
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
				meta: { annotations: { clientRegistered: true } },
			};

			const mockGetAbility = vi.fn().mockReturnValue( mockAbility );
			mockSelect( {
				getAbility: mockGetAbility,
			} );

			await expect(
				executeAbility( 'test/client-ability', {} )
			).rejects.toThrow( 'invalid output' );
		} );
	} );

	describe( 'getAbilityCategories', () => {
		it( 'should return all categories from the store', () => {
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

			const mockGetAbilityCategories = vi
				.fn()
				.mockReturnValue( mockCategories );
			mockSelect( {
				getAbilityCategories: mockGetAbilityCategories,
			} );

			const result = getAbilityCategories();

			expect( select ).toHaveBeenCalledWith( store );
			expect( mockGetAbilityCategories ).toHaveBeenCalled();
			expect( result ).toEqual( mockCategories );
		} );

		it( 'should return empty array when no categories exist', () => {
			const mockGetAbilityCategories = vi.fn().mockReturnValue( [] );
			mockSelect( {
				getAbilityCategories: mockGetAbilityCategories,
			} );

			const result = getAbilityCategories();

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'getAbilityCategory', () => {
		it( 'should return a specific category by slug', () => {
			const mockCategory: AbilityCategory = {
				slug: 'data-retrieval',
				label: 'Data Retrieval',
				description: 'Abilities that retrieve data',
			};

			const mockGetAbilityCategory = vi
				.fn()
				.mockReturnValue( mockCategory );
			mockSelect( {
				getAbilityCategory: mockGetAbilityCategory,
			} );

			const result = getAbilityCategory( 'data-retrieval' );

			expect( select ).toHaveBeenCalledWith( store );
			expect( mockGetAbilityCategory ).toHaveBeenCalledWith(
				'data-retrieval'
			);
			expect( result ).toEqual( mockCategory );
		} );

		it( 'should handle categories with meta', () => {
			const mockCategory: AbilityCategory = {
				slug: 'user-management',
				label: 'User Management',
				description: 'Abilities for managing users',
				meta: {
					annotations: { clientRegistered: true },
				},
			};

			const mockGetAbilityCategory = vi
				.fn()
				.mockReturnValue( mockCategory );
			mockSelect( {
				getAbilityCategory: mockGetAbilityCategory,
			} );

			const result = getAbilityCategory( 'user-management' );

			expect( result ).toEqual( mockCategory );
			expect( result?.meta ).toBeDefined();
			expect( result?.meta?.annotations?.clientRegistered ).toBe( true );
		} );
	} );
} );
