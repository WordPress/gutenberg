/**
 * Tests for store actions.
 */

/**
 * Internal dependencies
 */
import {
	registerAbility,
	unregisterAbility,
	registerAbilityCategory,
	unregisterAbilityCategory,
} from '../actions';
import {
	REGISTER_ABILITY,
	UNREGISTER_ABILITY,
	REGISTER_ABILITY_CATEGORY,
	UNREGISTER_ABILITY_CATEGORY,
} from '../constants';
import type {
	Ability,
	AbilityCategory,
	AbilityCategoryArgs,
} from '../../types';

describe( 'Store Actions', () => {
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
		} );

		it( 'should register a valid client ability', () => {
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
			action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability: {
					...ability,
					meta: { annotations: { clientRegistered: true } },
				},
			} );
		} );

		it( 'should register server-side abilities', () => {
			const ability: Ability = {
				name: 'test/server-ability',
				label: 'Server Ability',
				description: 'Server-side ability',
				category: 'test-category',
				input_schema: { type: 'object' },
				output_schema: { type: 'object' },
			};

			const action = registerAbility( ability );
			action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability: {
					...ability,
					meta: { annotations: { clientRegistered: true } },
				},
			} );
		} );

		it( 'should validate and reject ability without name', () => {
			const ability: Ability = {
				name: '',
				label: 'Test Ability',
				description: 'Test description',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Ability name is required' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability with invalid name format', () => {
			const testCases = [
				'invalid', // No namespace (only 1 segment)
				'my-plugin/a/b/c/d', // Too many slashes (5 segments)
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

				expect( () =>
					action( { select: mockSelect, dispatch: mockDispatch } )
				).toThrow(
					'Ability name must be a string containing a namespace prefix'
				);
				expect( mockDispatch ).not.toHaveBeenCalled();
				mockDispatch.mockClear();
			}
		} );

		it( 'should accept valid nested namespace ability names (2-4 segments)', () => {
			const validNames = [
				'test/ability', // 2 segments
				'core/posts/find', // 3 segments
				'my-plugin/resource/action', // 3 segments
				'my-plugin/resource/sub/action', // 4 segments
			];

			for ( const validName of validNames ) {
				const ability: Ability = {
					name: validName,
					label: 'Test Ability',
					description: 'Test description',
					category: 'test-category',
					callback: jest.fn(),
				};

				mockSelect.getAbility.mockReturnValue( null );
				mockDispatch.mockClear();

				const action = registerAbility( ability );
				action( { select: mockSelect, dispatch: mockDispatch } );

				expect( mockDispatch ).toHaveBeenCalledWith( {
					type: REGISTER_ABILITY,
					ability: {
						...ability,
						meta: { annotations: { clientRegistered: true } },
					},
				} );
			}
		} );

		it( 'should validate and reject ability without label', () => {
			const ability: Ability = {
				name: 'test/ability',
				label: '',
				description: 'Test description',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Ability "test/ability" must have a label' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability without description', () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: '',
				category: 'test-category',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Ability "test/ability" must have a description' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability without category', () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: '',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Ability "test/ability" must have a category' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject ability with invalid category format', () => {
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

				expect( () =>
					action( { select: mockSelect, dispatch: mockDispatch } )
				).toThrow(
					'Ability "test/ability" has an invalid category. Category must be lowercase alphanumeric with dashes only'
				);
				expect( mockDispatch ).not.toHaveBeenCalled();
				mockDispatch.mockClear();
			}
		} );

		it( 'should accept ability with valid category format', () => {
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

				// Mock select to return categories
				mockSelect.getAbilityCategories.mockReturnValue(
					categoriesForTest
				);

				mockSelect.getAbility.mockReturnValue( null );
				mockDispatch.mockClear();

				const action = registerAbility( ability );
				action( { select: mockSelect, dispatch: mockDispatch } );

				expect( mockDispatch ).toHaveBeenCalledWith( {
					type: REGISTER_ABILITY,
					ability: {
						...ability,
						meta: { annotations: { clientRegistered: true } },
					},
				} );
			}
		} );

		it( 'should validate and reject ability with non-existent category', () => {
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

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'Ability "test/ability" references non-existent category "non-existent-category". Please register the category first.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should accept ability with existing category', () => {
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

			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'data-retrieval',
				callback: jest.fn(),
			};

			const action = registerAbility( ability );
			action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability: {
					...ability,
					meta: { annotations: { clientRegistered: true } },
				},
			} );
		} );

		it( 'should validate and reject ability with invalid callback', () => {
			const ability: Ability = {
				name: 'test/ability',
				label: 'Test Ability',
				description: 'Test description',
				category: 'test-category',
				callback: 'not a function' as any,
			};

			const action = registerAbility( ability );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'Ability "test/ability" has an invalid callback. Callback must be a function'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should preserve arbitrary meta properties like scope', () => {
			const ability: Ability = {
				name: 'test/ability-with-scope',
				label: 'Test Ability',
				description: 'Test ability with custom scope',
				category: 'test-category',
				callback: jest.fn(),
				meta: {
					scope: 'editor',
					customProperty: 'customValue',
				},
			};

			const action = registerAbility( ability );
			action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability: {
					...ability,
					meta: {
						scope: 'editor',
						customProperty: 'customValue',
						annotations: { clientRegistered: true },
					},
				},
			} );
		} );

		it( 'should validate and reject already registered ability', () => {
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

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Ability "test/ability" is already registered' );
			expect( mockDispatch ).not.toHaveBeenCalled();
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
		} );

		it( 'should register a valid category', () => {
			const slug = 'test-category';
			const args: AbilityCategoryArgs = {
				label: 'Test Category',
				description: 'A test category for testing',
			};

			const action = registerAbilityCategory( slug, args );
			action( { select: mockSelect, dispatch: mockDispatch } );

			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY_CATEGORY,
				category: {
					slug,
					label: args.label,
					description: args.description,
					meta: { annotations: { clientRegistered: true } },
				},
			} );
		} );

		it( 'should register a category with meta and filter to only annotations', () => {
			const slug = 'test-category';
			const args: AbilityCategoryArgs = {
				label: 'Test Category',
				description: 'A test category',
				meta: {
					annotations: { serverRegistered: true },
				},
			};

			const action = registerAbilityCategory( slug, args );
			action( { select: mockSelect, dispatch: mockDispatch } );

			// Should only keep annotations, not add clientRegistered since serverRegistered is true
			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY_CATEGORY,
				category: {
					slug,
					label: args.label,
					description: args.description,
					meta: {
						annotations: { serverRegistered: true },
					},
				},
			} );
		} );

		it( 'should validate and reject empty slug', () => {
			const args: AbilityCategoryArgs = {
				label: 'Test',
				description: 'Test',
			};

			const action = registerAbilityCategory( '', args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Category slug is required' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject invalid slug formats', () => {
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

				expect( () =>
					action( { select: mockSelect, dispatch: mockDispatch } )
				).toThrow(
					'Category slug must contain only lowercase alphanumeric characters and dashes'
				);
				expect( mockDispatch ).not.toHaveBeenCalled();
				mockDispatch.mockClear();
			}
		} );

		it( 'should accept valid slug formats', () => {
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
				action( { select: mockSelect, dispatch: mockDispatch } );

				expect( mockDispatch ).toHaveBeenCalledWith( {
					type: REGISTER_ABILITY_CATEGORY,
					category: {
						slug: validSlug,
						label: args.label,
						description: args.description,
						meta: { annotations: { clientRegistered: true } },
					},
				} );
			}
		} );

		it( 'should validate and reject missing label', () => {
			const slug = 'test-category';
			const args = {
				label: '',
				description: 'Test',
			} as AbilityCategoryArgs;

			const action = registerAbilityCategory( slug, args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'The category properties must contain a `label` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject non-string label', () => {
			const slug = 'test-category';
			const args = {
				label: 123 as any,
				description: 'Test',
			};

			const action = registerAbilityCategory( slug, args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'The category properties must contain a `label` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject missing description', () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: '',
			} as AbilityCategoryArgs;

			const action = registerAbilityCategory( slug, args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'The category properties must contain a `description` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject non-string description', () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: 123 as any,
			};

			const action = registerAbilityCategory( slug, args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'The category properties must contain a `description` string.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject non-object meta', () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: 'Test',
				meta: 'invalid' as any,
			};

			const action = registerAbilityCategory( slug, args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'The category properties should provide a valid `meta` object.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject array as meta', () => {
			const slug = 'test-category';
			const args = {
				label: 'Test',
				description: 'Test',
				meta: [ 'invalid' ] as any,
			};

			const action = registerAbilityCategory( slug, args );

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow(
				'The category properties should provide a valid `meta` object.'
			);
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should validate and reject already registered category', () => {
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

			expect( () =>
				action( { select: mockSelect, dispatch: mockDispatch } )
			).toThrow( 'Category "test-category" is already registered.' );
			expect( mockDispatch ).not.toHaveBeenCalled();
		} );

		it( 'should allow registering ability after registering category', () => {
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
			categoryAction( {
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
					meta: { annotations: { clientRegistered: true } },
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
			abilityAction( {
				select: mockSelect,
				dispatch: mockDispatch,
			} );

			// Should successfully register with the new category
			expect( mockDispatch ).toHaveBeenCalledWith( {
				type: REGISTER_ABILITY,
				ability: {
					...ability,
					meta: { annotations: { clientRegistered: true } },
				},
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
