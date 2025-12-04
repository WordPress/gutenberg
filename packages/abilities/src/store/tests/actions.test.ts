/**
 * Tests for store actions.
 */

/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	receiveAbilities,
	registerAbility,
	unregisterAbility,
	receiveCategories,
	registerAbilityCategory,
	unregisterAbilityCategory,
} from '../actions';
import {
	RECEIVE_ABILITIES,
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	RECEIVE_CATEGORIES,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
} from '../constants';
import type {
	Ability,
	AbilityCategory,
	AbilityCategoryArgs,
} from '../../types';

// Mock the WordPress data store
jest.mock( '@wordpress/data', () => ( {
	resolveSelect: jest.fn(),
} ) );

describe( 'Store Actions', () => {
	describe( 'receiveAbilities', () => {
		it( 'should create an action to receive abilities', () => {
			const abilities: Ability[] = [
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

			const action = receiveAbilities( abilities );

			expect( action ).toEqual( {
				type: RECEIVE_ABILITIES,
				abilities,
			} );
		} );

		it( 'should handle empty abilities array', () => {
			const abilities: Ability[] = [];
			const action = receiveAbilities( abilities );

			expect( action ).toEqual( {
				type: RECEIVE_ABILITIES,
				abilities: [],
			} );
		} );
	} );

	describe( 'registerAbility', () => {
		let mockSelect: any;
		let mockDispatch: jest.Mock;

		beforeEach( () => {
			jest.clearAllMocks();
			const defaultCategories = [
				{
					slug: 'test-category',
					label: 'Test Category',
					description: 'Test category for testing',
				},
				{
					slug: 'data-retrieval',
					label: 'Data Retrieval',
					description: 'Abilities that retrieve data',
				},
			];

			mockSelect = {
				getAbility: jest.fn().mockReturnValue( null ),
				getAbilityCategories: jest
					.fn()
					.mockReturnValue( defaultCategories ),
				getAbilityCategory: jest.fn().mockImplementation( ( slug ) => {
					const categories: Record< string, any > = {
						'test-category': {
							slug: 'test-category',
							label: 'Test Category',
							description: 'Test category for testing',
						},
						'data-retrieval': {
							slug: 'data-retrieval',
							label: 'Data Retrieval',
							description: 'Abilities that retrieve data',
						},
					};
					return categories[ slug ] || null;
				} ),
			};
			mockDispatch = jest.fn();

			// Mock resolveSelect to return categories
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: jest
					.fn()
					.mockResolvedValue( defaultCategories ),
			} );
		} );

		it( 'should register a valid client ability', async () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test ability description',
				category: 'test-category',
				input_schema: {
					type: 'object',
					properties: {
						message: { type: 'string' },
					},
				},
				output_schema: {
					type: 'object',
					properties: {
						success: { type: 'boolean' },
					},
				},
				callback: jest.fn(),
			};

			const action = registerAbility( ability );
			await action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability,
			} );
		} );

		it( 'should register server-side abilities', async () => {
			const ability: Ability = {
				name: 'test/server-ability',
				label: 'Server Ability',
				description: 'Server-side ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const action = registerAbility( ability );
			await action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability,
			} );
		} );

		it( 'should validate and reject ability without name', async () => {
			const ability: Ability = {
				name: '',
				label: 'Test Ability',
				description: 'Test description',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow( 'Ability name is required' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability with invalid name format', async () => {
			const testCases = [
				'invalid', // No namespace
				'my-plugin/feature/action', // Multiple slashes
				'My-Plugin/feature', // Uppercase letters
				'my_plugin/feature', // Underscores not allowed
				'my-plugin/feature!', // Special characters not allowed
				'my plugin/feature', // Spaces not allowed
			];

			for ( const invalidName of testCases ) {
				const ability: Ability = {
					name: invalidName,
					label: 'Test Ability',
					description: 'Test description',
					category: 'test-category',
					callback: jest.fn(),
				};

				const action = registerAbility( ability );

				await expect(
					action( { select: mockSelect, dispatch: mockDispatch } )
				).rejects.toThrow(
					'Ability name must be a string containing a namespace prefix'
				);
				expect( mockDispatch ).not.toHaveBeenCalled();
				mockDispatch.mockClear();
			}
		} );

		it( 'should validate and reject ability without label', async () => {
			const ability: Ability = {
				name: 'test/ability',
				label: '',
				description: 'Test description',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow( 'Ability "test/ability" must have a label' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability without description', async () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: '',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'Ability "test/ability" must have a description'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability without category', async () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: '',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow( 'Ability "test/ability" must have a category' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability with invalid category format', async () => {
			const testCases = [
				'Data-Retrieval', // Uppercase letters
				'data_retrieval', // Underscores not allowed
				'data.retrieval', // Dots not allowed
				'data/retrieval', // Slashes not allowed
				'-data-retrieval', // Leading dash
				'data-retrieval-', // Trailing dash
				'data--retrieval', // Double dash
			];

			for ( const invalidCategory of testCases ) {
				const ability: Ability = {
					name: 'test/ability',
					label: 'Test Ability',
					description: 'Test description',
					category: invalidCategory,
					callback: jest.fn(),
				};

				const action = registerAbility( ability );

				await expect(
					action( { select: mockSelect, dispatch: mockDispatch } )
				).rejects.toThrow(
					'Ability "test/ability" has an invalid category. Category must be lowercase alphanumeric with dashes only'
				);
				expect( mockDispatch ).not.toHaveBeenCalled();
				mockDispatch.mockClear();
			}
		} );

		it( 'should accept ability with valid category format', async () => {
			const validCategories = [
				'data-retrieval',
				'user-management',
				'analytics-123',
				'ecommerce',
			];

			for ( const validCategory of validCategories ) {
				const ability: Ability = {
					name: 'test/ability-' + validCategory,
					label: 'Test Ability',
					description: 'Test description',
					category: validCategory,
					callback: jest.fn(),
				};

				const categoriesForTest = [
					{
						slug: 'test-category',
						label: 'Test Category',
						description: 'Test category for testing',
					},
					{
						slug: 'data-retrieval',
						label: 'Data Retrieval',
						description: 'Abilities that retrieve data',
					},
					{
						slug: validCategory,
						label: 'Test Category',
						description: 'Test',
					},
				];

				// Mock both select and resolveSelect
				mockSelect.getAbilityCategories.mockReturnValue(
					categoriesForTest
				);
				( resolveSelect as jest.Mock ).mockReturnValue( {
					getAbilityCategories: jest
						.fn()
						.mockResolvedValue( categoriesForTest ),
				} );

				mockSelect.getAbility.mockReturnValue( null );
				mockDispatch.mockClear();

				const action = registerAbility( ability );
				await action( { select: mockSelect, dispatch: mockDispatch } );

				expect( mockDispatch ).toHaveBeenCalledWith( {
					type: REGISTER_ABILITY,
					ability,
				} );
			}
		} );

		it( 'should validate and reject ability with non-existent category', async () => {
			mockSelect.getAbilityCategories.mockReturnValue( [
				{
					slug: 'test-category',
					label: 'Test Category',
					description: 'Test category for testing',
				},
				{
					slug: 'data-retrieval',
					label: 'Data Retrieval',
					description: 'Abilities that retrieve data',
				},
			] );

			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'non-existent-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'Ability "test/ability" references non-existent category "non-existent-category". Please register the category first.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should accept ability with existing category', async () => {
			const categoriesForTest = [
				{
					slug: 'test-category',
					label: 'Test Category',
					description: 'Test category for testing',
				},
				{
					slug: 'data-retrieval',
					label: 'Data Retrieval',
					description: 'Abilities that retrieve data',
				},
			];

			mockSelect.getAbilityCategories.mockReturnValue(
				categoriesForTest
			);
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: jest
					.fn()
					.mockResolvedValue( categoriesForTest ),
			} );

			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'data-retrieval',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );
			await action( { select: mockSelect, dispatch: mockDispatch } );

			// resolveSelect should have been called to load categories
			expect( resolveSelect ).toHaveBeenCalledWith( 'core/abilities' );
			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability,
			} );
		} );

		it( 'should validate and reject ability with invalid callback', async () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'test-category',
				callback: 'not a function' as any,
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'Ability "test/ability" has an invalid callback. Callback must be a function'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject already registered ability', async () => {
			const existingAbility: Ability = {
				name: 'test/ability',
				label: 'Existing Ability',
				description: 'Already registered',
				category: 'test-category',
			};

			mockSelect.getAbility.mockReturnValue( existingAbility );

			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow( 'Ability "test/ability" is already registered' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should load categories using resolveSelect before validation', async () => {
			const categories = [
				{
					slug: 'test-category',
					label: 'Test Category',
					description: 'Test category',
				},
			];

			// Mock resolveSelect to return categories directly
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: jest.fn().mockResolvedValue( categories ),
			} );

			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );
			await action( { select: mockSelect, dispatch: mockDispatch } );

			// Should have called resolveSelect to load categories
			expect( resolveSelect ).toHaveBeenCalledWith( 'core/abilities' );
			// Should have successfully registered
			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability,
			} );
		} );
	} );

	describe( 'unregisterAbility', () => {
		it( 'should create an action to unregister an ability', () => {
			const abilityName = 'test/ability';
			const action = unregisterAbility( abilityName );

			expect( action ).toEqual( {
				type: UNREGISTER_ABILITY,
				name: abilityName,
			} );
		} );

		it( 'should handle valid namespaced ability names', () => {
			const abilityName = 'my-plugin/feature-action';
			const action = unregisterAbility( abilityName );

			expect( action ).toEqual( {
				type: UNREGISTER_ABILITY,
				name: abilityName,
			} );
		} );
	} );

	describe( 'receiveCategories', () => {
		it( 'should create an action to receive categories', () => {
			const categories: AbilityCategory[] = [
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

			const action = receiveCategories( categories );

			expect( action ).toEqual( {
				type: RECEIVE_CATEGORIES,
				categories,
			} );
		} );

		it( 'should handle empty categories array', () => {
			const categories: AbilityCategory[] = [];
			const action = receiveCategories( categories );

			expect( action ).toEqual( {
				type: RECEIVE_CATEGORIES,
				categories: [],
			} );
		} );
	} );

	describe( 'registerAbilityCategory', () => {
		let mockSelect: any;
		let mockDispatch: jest.Mock;

		beforeEach( () => {
			jest.clearAllMocks();
			mockSelect = {
				getAbilityCategory: jest.fn().mockReturnValue( null ),
				getAbilityCategories: jest.fn().mockReturnValue( [] ),
			};
			mockDispatch = jest.fn();

			// Mock resolveSelect to return a mock that resolves the getAbilityCategories call
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: jest.fn().mockResolvedValue( undefined ),
			} );
		} );

		it( 'should register a valid category', async () => {
			const slug = 'test-category';
			const args: AbilityCategoryArgs = {
				label: 'Test Category',
				description: 'A test category for testing',
			};

			const action = registerAbilityCategory( slug, args );
			await action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY_CATEGORY,
				category: {
					slug,
					label: args.label,
					description: args.description,
					meta: {
						_clientRegistered: true,
					},
				},
			} );
		} );

		it( 'should register a category with meta', async () => {
			const slug = 'test-category';
			const args: AbilityCategoryArgs = {
				label: 'Test Category',
				description: 'A test category',
				meta: { foo: 'bar', nested: { key: 'value' } },
			};

			const action = registerAbilityCategory( slug, args );
			await action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY_CATEGORY,
				category: {
					slug,
					label: args.label,
					description: args.description,
					meta: {
						...args.meta,
						_clientRegistered: true,
					},
				},
			} );
		} );

		it( 'should validate and reject empty slug', async () => {
			const args: AbilityCategoryArgs = {
				label: 'Test',
				description: 'Test',
			};

			const action = registerAbilityCategory( '', args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow( 'Category slug is required' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject invalid slug formats', async () => {
			const testCases = [
				'Data-Retrieval', // Uppercase
				'data_retrieval', // Underscores
				'data.retrieval', // Dots
				'data/retrieval', // Slashes
				'-data-retrieval', // Leading dash
				'data-retrieval-', // Trailing dash
				'data--retrieval', // Double dash
				'data retrieval', // Spaces
				'data!retrieval', // Special characters
			];

			const args: AbilityCategoryArgs = {
				label: 'Test',
				description: 'Test',
			};

			for ( const invalidSlug of testCases ) {
				const action = registerAbilityCategory( invalidSlug, args );

				await expect(
					action( { select: mockSelect, dispatch: mockDispatch } )
				).rejects.toThrow(
					'Category slug must contain only lowercase alphanumeric characters and dashes'
				);
				expect( mockDispatch ).not.toHaveBeenCalled();
				mockDispatch.mockClear();
			}
		} );

		it( 'should accept valid slug formats', async () => {
			const validSlugs = [
				'data-retrieval',
				'user-management',
				'analytics-123',
				'ecommerce',
				'a',
				'123',
				'test-multiple-words-with-dashes',
			];

			const args: AbilityCategoryArgs = {
				label: 'Test Category',
				description: 'Test description',
			};

			for ( const validSlug of validSlugs ) {
				mockSelect.getAbilityCategory.mockReturnValue( null );
				mockDispatch.mockClear();

				const action = registerAbilityCategory( validSlug, args );
				await action( { select: mockSelect, dispatch: mockDispatch } );

				expect( mockDispatch ).toHaveBeenCalledWith( {
					type: REGISTER_ABILITY_CATEGORY,
					category: {
						slug: validSlug,
						label: args.label,
						description: args.description,
						meta: {
							_clientRegistered: true,
						},
					},
				} );
			}
		} );

		it( 'should validate and reject missing label', async () => {
			const slug = 'test-category';
			const args = {
				label: '',
				description: 'Test',
			} as AbilityCategoryArgs;

			const action = registerAbilityCategory( slug, args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'The category properties must contain a `label` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject non-string label', async () => {
			const slug = 'test-category';
			const args = {
				label: 123 as any,
				description: 'Test',
			};

			const action = registerAbilityCategory( slug, args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'The category properties must contain a `label` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject missing description', async () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: '',
			} as AbilityCategoryArgs;

			const action = registerAbilityCategory( slug, args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'The category properties must contain a `description` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject non-string description', async () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: 123 as any,
			};

			const action = registerAbilityCategory( slug, args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'The category properties must contain a `description` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject non-object meta', async () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: 'Test',
				meta: 'invalid' as any,
			};

			const action = registerAbilityCategory( slug, args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'The category properties should provide a valid `meta` object.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject array as meta', async () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: 'Test',
				meta: [ 'invalid' ] as any,
			};

			const action = registerAbilityCategory( slug, args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'The category properties should provide a valid `meta` object.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject already registered category', async () => {
			const existingCategory: AbilityCategory = {
				slug: 'test-category',
				label: 'Existing Category',
				description: 'Already registered',
			};

			mockSelect.getAbilityCategory.mockReturnValue( existingCategory );

			const args: AbilityCategoryArgs = {
				label: 'Test',
				description: 'Test',
			};

			const action = registerAbilityCategory( 'test-category', args );

			await expect(
				action( { select: mockSelect, dispatch: mockDispatch } )
			).rejects.toThrow(
				'Category "test-category" is already registered.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should allow registering ability after registering category', async () => {
			// First register a category
			const categorySlug = 'new-category';
			const categoryArgs: AbilityCategoryArgs = {
				label: 'New Category',
				description: 'A newly registered category',
			};

			const categoryAction = registerAbilityCategory(
				categorySlug,
				categoryArgs
			);
			await categoryAction( {
				select: mockSelect,
				dispatch: mockDispatch,
			} );

			// Verify category was registered
			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY_CATEGORY,
				category: {
					slug: categorySlug,
					label: categoryArgs.label,
					description: categoryArgs.description,
					meta: {
						_clientRegistered: true,
					},
				},
			} );

			// Now mock that the category exists for ability registration
			const categoriesWithNew = [
				{
					slug: categorySlug,
					label: categoryArgs.label,
					description: categoryArgs.description,
				},
			];
			mockSelect.getAbilityCategories = jest
				.fn()
				.mockReturnValue( categoriesWithNew );
			( resolveSelect as jest.Mock ).mockReturnValue( {
				getAbilityCategories: jest
					.fn()
					.mockResolvedValue( categoriesWithNew ),
			} );
			mockSelect.getAbility = jest.fn().mockReturnValue( null );
			mockDispatch.mockClear();

			// Register an ability using the new category
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: categorySlug,
				callback: jest.fn(),
			};

			const abilityAction = registerAbility( ability );
			await abilityAction( {
				select: mockSelect,
				dispatch: mockDispatch,
			} );

			// Should successfully register with the new category
			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability,
			} );
		} );
	} );

	describe( 'unregisterAbilityCategory', () => {
		it( 'should create an action to unregister a category', () => {
			const slug = 'test-category';
			const action = unregisterAbilityCategory( slug );

			expect( action ).toEqual( {
				type: UNREGISTER_ABILITY_CATEGORY,
				slug,
			} );
		} );

		it( 'should handle valid category slugs', () => {
			const slug = 'data-retrieval';
			const action = unregisterAbilityCategory( slug );

			expect( action ).toEqual( {
				type: UNREGISTER_ABILITY_CATEGORY,
				slug,
			} );
		} );
	} );
} );
