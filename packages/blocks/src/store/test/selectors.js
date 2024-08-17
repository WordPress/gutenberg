/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getBlockSupport,
	getChildBlockNames,
	getBlockVariations,
	getDefaultBlockVariation,
	getGroupingBlockName,
	isMatchingSearchTerm,
	getCategories,
	getActiveBlockVariation,
} from '../selectors';

/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';

const keyBlocksByName = ( blocks ) =>
	blocks.reduce(
		( result, block ) => ( { ...result, [ block.name ]: block } ),
		{}
	);

describe( 'selectors', () => {
	describe( 'getBlockSupport', () => {
		const blockName = 'block/name';
		const getState = ( blocks ) => {
			return deepFreeze( {
				blockTypes: keyBlocksByName( blocks ),
			} );
		};

		it( 'returns default value when config entry not found', () => {
			const state = getState( [] );

			expect(
				getBlockSupport( state, blockName, 'unknown', 'default' )
			).toBe( 'default' );
		} );

		it( 'returns value when config found but falsy', () => {
			const state = getState( [
				{
					name: blockName,
					supports: {
						falsy: '',
					},
				},
			] );

			expect(
				getBlockSupport( state, blockName, 'falsy', 'default' )
			).toBe( '' );
		} );

		it( 'works with configs stored as nested objects', () => {
			const state = getState( [
				{
					name: blockName,
					supports: {
						features: {
							foo: {
								bar: 'value',
							},
						},
					},
				},
			] );

			expect(
				getBlockSupport( state, blockName, 'features.foo.bar' )
			).toBe( 'value' );
		} );
	} );

	describe( 'getCategories', () => {
		it( 'returns categories state', () => {
			const categories = [ { slug: 'text', text: 'Text' } ];
			const state = deepFreeze( { categories } );

			expect( getCategories( state ) ).toEqual( categories );
		} );
	} );

	describe( 'getChildBlockNames', () => {
		it( 'should return an empty array if state is empty', () => {
			const state = {
				blockTypes: {},
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toHaveLength( 0 );
		} );

		it( 'should return an empty array if no children exist', () => {
			const state = {
				blockTypes: {
					child1: {
						name: 'child1',
						parent: [ 'parent1' ],
					},
					child2: {
						name: 'child2',
						parent: [ 'parent2' ],
					},
					parent3: {
						name: 'parent3',
					},
				},
			};

			expect( getChildBlockNames( state, 'parent3' ) ).toHaveLength( 0 );
		} );

		it( 'should return an empty array if the parent block is not found', () => {
			const state = {
				blockTypes: {
					child1: {
						name: 'child1',
						parent: [ 'parent1' ],
					},
					parent1: {
						name: 'parent1',
					},
				},
			};

			expect( getChildBlockNames( state, 'parent3' ) ).toHaveLength( 0 );
		} );

		it( 'should return an array with the child block names', () => {
			const state = {
				blockTypes: {
					child1: {
						name: 'child1',
						parent: [ 'parent1' ],
					},
					child2: {
						name: 'child2',
						parent: [ 'parent2' ],
					},
					child3: {
						name: 'child3',
						parent: [ 'parent1' ],
					},
					child4: {
						name: 'child4',
					},
					parent1: {
						name: 'parent1',
					},
					parent2: {
						name: 'parent2',
					},
				},
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toEqual( [
				'child1',
				'child3',
			] );
		} );

		it( 'should return an array with the child block names even if only one child exists', () => {
			const state = {
				blockTypes: {
					child1: {
						name: 'child1',
						parent: [ 'parent1' ],
					},
					child2: {
						name: 'child2',
						parent: [ 'parent2' ],
					},
					child4: {
						name: 'child4',
					},
					parent1: {
						name: 'parent1',
					},
					parent2: {
						name: 'parent2',
					},
				},
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toEqual( [
				'child1',
			] );
		} );

		it( 'should return an array with the child block names even if children have multiple parents', () => {
			const state = {
				blockTypes: {
					child1: {
						name: 'child1',
						parent: [ 'parent1' ],
					},
					child2: {
						name: 'child2',
						parent: [ 'parent1', 'parent2' ],
					},
					child3: {
						name: 'child3',
						parent: [ 'parent1' ],
					},
					child4: {
						name: 'child4',
					},
					parent1: {
						name: 'parent1',
					},
					parent2: {
						name: 'parent2',
					},
				},
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toEqual( [
				'child1',
				'child2',
				'child3',
			] );
			expect( getChildBlockNames( state, 'parent2' ) ).toEqual( [
				'child2',
			] );
		} );
	} );

	describe( 'Testing block variations selectors', () => {
		const blockName = 'block/name';
		const createBlockVariationsState = ( variations ) => {
			return deepFreeze( {
				blockVariations: {
					[ blockName ]: variations,
				},
			} );
		};
		const firstBlockVariation = {
			name: 'first-block-variation',
		};
		const secondBlockVariation = {
			name: 'second-block-variation',
		};
		const thirdBlockVariation = {
			name: 'third-block-variation',
		};
		describe( 'getBlockVariations', () => {
			it( 'should return undefined if no variations exists', () => {
				expect(
					getBlockVariations( { blockVariations: {} }, blockName )
				).toBeUndefined();
			} );
			it( 'should return all variations if scope is not provided', () => {
				const variations = [
					firstBlockVariation,
					secondBlockVariation,
				];
				const state = createBlockVariationsState( variations );
				expect( getBlockVariations( state, blockName ) ).toEqual(
					variations
				);
			} );
			it( 'should return variations with scope not set at all or explicitly set', () => {
				const variations = [
					{ ...firstBlockVariation, scope: [ 'inserter' ] },
					{ name: 'only-block', scope: [ 'block' ] },
					{
						name: 'multiple-scopes-with-block',
						scope: [ 'transform', 'block' ],
					},
					{ name: 'no-scope' },
				];
				const state = createBlockVariationsState( variations );
				const result = getBlockVariations( state, blockName, 'block' );
				expect( result ).toHaveLength( 3 );
				expect( result.map( ( { name } ) => name ) ).toEqual(
					expect.arrayContaining( [
						'only-block',
						'multiple-scopes-with-block',
						'no-scope',
					] )
				);
			} );
		} );
		describe( 'getActiveBlockVariation', () => {
			const blockTypeWithTestAttributes = {
				name: 'block/name',
				attributes: {
					testAttribute: {},
					firstTestAttribute: {},
					secondTestAttribute: {},
					thirdTestAttribute: {},
				},
			};
			const FIRST_VARIATION_TEST_ATTRIBUTE_VALUE = 1;
			const SECOND_VARIATION_TEST_ATTRIBUTE_VALUE = 2;
			const UNUSED_TEST_ATTRIBUTE_VALUE = 5555;
			const firstActiveBlockVariationFunction = {
				...firstBlockVariation,
				attributes: {
					testAttribute: FIRST_VARIATION_TEST_ATTRIBUTE_VALUE,
				},
				isActive: ( blockAttributes, variationAttributes ) => {
					return (
						blockAttributes.testAttribute ===
						variationAttributes.testAttribute
					);
				},
			};
			const secondActiveBlockVariationFunction = {
				...secondBlockVariation,
				attributes: {
					testAttribute: SECOND_VARIATION_TEST_ATTRIBUTE_VALUE,
				},
				isActive: ( blockAttributes, variationAttributes ) => {
					return (
						blockAttributes.testAttribute ===
						variationAttributes.testAttribute
					);
				},
			};
			const firstActiveBlockVariationArray = {
				...firstBlockVariation,
				attributes: {
					testAttribute: FIRST_VARIATION_TEST_ATTRIBUTE_VALUE,
				},
				isActive: [ 'testAttribute' ],
			};
			const secondActiveBlockVariationArray = {
				...secondBlockVariation,
				attributes: {
					testAttribute: SECOND_VARIATION_TEST_ATTRIBUTE_VALUE,
				},
				isActive: [ 'testAttribute' ],
			};
			const createBlockVariationsStateWithTestBlockType = (
				variations
			) =>
				deepFreeze( {
					...createBlockVariationsState( variations ),
					blockTypes: {
						[ blockTypeWithTestAttributes.name ]:
							blockTypeWithTestAttributes,
					},
				} );
			const stateFunction = createBlockVariationsStateWithTestBlockType( [
				firstActiveBlockVariationFunction,
				secondActiveBlockVariationFunction,
				thirdBlockVariation,
			] );
			const stateArray = createBlockVariationsStateWithTestBlockType( [
				firstActiveBlockVariationArray,
				secondActiveBlockVariationArray,
				thirdBlockVariation,
			] );
			test.each( [
				[
					firstActiveBlockVariationFunction.name,
					firstActiveBlockVariationFunction,
				],
				[
					secondActiveBlockVariationFunction.name,
					secondActiveBlockVariationFunction,
				],
			] )(
				'should return the active variation based on the given isActive function (%s)',
				( _variationName, variation ) => {
					const blockAttributes = {
						testAttribute: variation.attributes.testAttribute,
					};

					const result = getActiveBlockVariation(
						stateFunction,
						blockName,
						blockAttributes
					);

					expect( result ).toEqual( variation );
				}
			);
			it( 'should return undefined if no active variation is found', () => {
				const blockAttributes = {
					testAttribute: UNUSED_TEST_ATTRIBUTE_VALUE,
				};

				const result = getActiveBlockVariation(
					stateFunction,
					blockName,
					blockAttributes
				);

				expect( result ).toBeUndefined();
			} );
			it( 'should return the active variation based on the given isActive array', () => {
				[
					firstActiveBlockVariationArray,
					secondActiveBlockVariationArray,
				].forEach( ( variation ) => {
					const blockAttributes = {
						testAttribute: variation.attributes.testAttribute,
					};

					const result = getActiveBlockVariation(
						stateArray,
						blockName,
						blockAttributes
					);

					expect( result ).toEqual( variation );
				} );
			} );
			it( 'should support nested attribute paths in the isActive array', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute: {
								nestedProperty: 1,
								otherNestedProperty: 5555,
							},
						},
						isActive: [ 'firstTestAttribute.nestedProperty' ],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute: {
								nestedProperty: 2,
								otherNestedProperty: 5555,
							},
						},
						isActive: [ 'firstTestAttribute.nestedProperty' ],
					},
				];
				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: {
							nestedProperty: 1,
						},
					} )
				).toEqual( variations[ 0 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: {
							nestedProperty: 2,
						},
					} )
				).toEqual( variations[ 1 ] );
			} );
			it( 'should support RichText attributes in the isActive array', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute:
								'This is a <strong>RichText</strong> attribute.',
						},
						isActive: [ 'firstTestAttribute' ],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute:
								'This is a <em>RichText</em> attribute.',
						},
						isActive: [ 'firstTestAttribute' ],
					},
				];
				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: RichTextData.fromHTMLString(
							'This is a <strong>RichText</strong> attribute.'
						),
					} )
				).toEqual( variations[ 0 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: RichTextData.fromHTMLString(
							'This is a <em>RichText</em> attribute.'
						),
					} )
				).toEqual( variations[ 1 ] );
			} );
			it( 'should compare object attributes in the isActive array based on given properties', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute: {
								nestedProperty: 1,
								secondNestedProperty: 10,
							},
							secondTestAttribute: {
								nestedProperty: {
									firstDeeplyNestedProperty: 'a1',
									secondDeeplyNestedProperty: 'a2',
								},
							},
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute.nestedProperty',
						],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute: {
								nestedProperty: 2,
								secondNestedProperty: 20,
							},
							secondTestAttribute: {
								nestedProperty: {
									firstDeeplyNestedProperty: 'b1',
									secondDeeplyNestedProperty: 'b2',
								},
							},
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute.nestedProperty',
						],
					},
				];
				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: {
							nestedProperty: 1,
							secondNestedProperty: 10,
							otherNestedProperty: 5555,
						},
						secondTestAttribute: {
							nestedProperty: {
								firstDeeplyNestedProperty: 'a1',
								secondDeeplyNestedProperty: 'a2',
								otherDeeplyNestedProperty: 'ffff',
							},
						},
					} )
				).toEqual( variations[ 0 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: {
							nestedProperty: 2,
							secondNestedProperty: 20,
							otherNestedProperty: 5555,
						},
						secondTestAttribute: {
							nestedProperty: {
								firstDeeplyNestedProperty: 'b1',
								secondDeeplyNestedProperty: 'b2',
								otherDeeplyNestedProperty: 'ffff',
							},
						},
					} )
				).toEqual( variations[ 1 ] );
			} );
			it( 'should return the active variation based on the given isActive array (multiple values)', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 10,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
						],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute: 2,
							secondTestAttribute: 20,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
						],
					},
					{
						name: 'variation-3',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 20,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
						],
					},
				];

				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 10,
					} )
				).toEqual( variations[ 0 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 2,
						secondTestAttribute: 20,
					} )
				).toEqual( variations[ 1 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 20,
					} )
				).toEqual( variations[ 2 ] );
			} );
			it( 'should return the active variation using the match with the highest specificity for the given isActive array (multiple values)', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 2,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
						],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 2,
							thirdTestAttribute: 3,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
							'thirdTestAttribute',
						],
					},
					{
						name: 'variation-3',
						attributes: {
							firstTestAttribute: 1,
							thirdTestAttribute: 3,
						},
						isActive: [
							'firstTestAttribute',
							'thirdTestAttribute',
						],
					},
				];

				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 2,
					} )
				).toEqual( variations[ 0 ] );
				// All variations match the following attributes. Since all matches have an array for their isActive
				// fields, we can compare the specificity of each match and return the most specific match.
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 2,
						thirdTestAttribute: 3,
					} )
				).toEqual( variations[ 1 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						thirdTestAttribute: 3,
					} )
				).toEqual( variations[ 2 ] );
			} );
			it( 'should return the active variation using the first match given the isActive array (multiple values) and function', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 2,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
						],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 2,
							thirdTestAttribute: 3,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
							'thirdTestAttribute',
						],
					},
					{
						name: 'variation-3',
						attributes: {
							firstTestAttribute: 1,
							thirdTestAttribute: 3,
						},
						isActive: ( blockAttributes, variationAttributes ) =>
							blockAttributes.firstTestAttribute ===
								variationAttributes.firstTestAttribute &&
							blockAttributes.thirdTestAttribute ===
								variationAttributes.thirdTestAttribute,
					},
				];

				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 2,
					} )
				).toEqual( variations[ 0 ] );
				// All variations match the following attributes. However, since the third variation has a function
				// for its isActive field, we cannot compare the specificity of each match, so instead we return the
				// best match we've found.
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 2,
						thirdTestAttribute: 3,
					} )
				).toEqual( variations[ 1 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						thirdTestAttribute: 3,
					} )
				).toEqual( variations[ 2 ] );
			} );
			it( 'should ignore attributes that are not defined in the block type', () => {
				const variations = [
					{
						name: 'variation-1',
						attributes: {
							firstTestAttribute: 1,
							secondTestAttribute: 10,
							undefinedTestAttribute: 100,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
							'undefinedTestAttribute',
						],
					},
					{
						name: 'variation-2',
						attributes: {
							firstTestAttribute: 2,
							secondTestAttribute: 20,
							undefinedTestAttribute: 200,
						},
						isActive: [
							'firstTestAttribute',
							'secondTestAttribute',
							'undefinedTestAttribute',
						],
					},
				];

				const state =
					createBlockVariationsStateWithTestBlockType( variations );

				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 10,
						undefinedTestAttribute: 100,
					} )
				).toEqual( variations[ 0 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 1,
						secondTestAttribute: 10,
						undefinedTestAttribute: 1234,
					} )
				).toEqual( variations[ 0 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 2,
						secondTestAttribute: 20,
						undefinedTestAttribute: 200,
					} )
				).toEqual( variations[ 1 ] );
				expect(
					getActiveBlockVariation( state, blockName, {
						firstTestAttribute: 2,
						secondTestAttribute: 20,
						undefinedTestAttribute: 2345,
					} )
				).toEqual( variations[ 1 ] );
			} );
		} );
		describe( 'getDefaultBlockVariation', () => {
			it( 'should return the default variation when set', () => {
				const defaultBlockVariation = {
					...secondBlockVariation,
					isDefault: true,
				};
				const state = createBlockVariationsState( [
					firstBlockVariation,
					defaultBlockVariation,
					thirdBlockVariation,
				] );

				const result = getDefaultBlockVariation( state, blockName );

				expect( result ).toEqual( defaultBlockVariation );
			} );

			it( 'should return the last variation when multiple default variations added', () => {
				const defaultBlockVariation = {
					...thirdBlockVariation,
					isDefault: true,
				};
				const state = createBlockVariationsState( [
					{
						...firstBlockVariation,
						isDefault: true,
					},
					{
						...secondBlockVariation,
						isDefault: true,
					},
					defaultBlockVariation,
				] );

				const result = getDefaultBlockVariation( state, blockName );

				expect( result ).toEqual( defaultBlockVariation );
			} );

			it( 'should return the first variation when no default variation set', () => {
				const state = createBlockVariationsState( [
					firstBlockVariation,
					secondBlockVariation,
					thirdBlockVariation,
				] );

				const result = getDefaultBlockVariation( state, blockName );

				expect( result ).toEqual( firstBlockVariation );
			} );
		} );
	} );

	describe( 'isMatchingSearchTerm', () => {
		const name = 'core/paragraph';
		const category = 'text';
		const description = 'writing flow';

		const blockTypeBase = {
			title: 'Paragraph',
			keywords: [ 'body' ],
		};
		const blockType = {
			...blockTypeBase,
			category,
			description,
		};
		const blockTypeWithoutCategory = {
			...blockTypeBase,
			description,
		};
		const blockTypeWithoutDescription = {
			...blockTypeBase,
			category,
		};
		const blockTypeWithNonStringDescription = {
			...blockTypeBase,
			description: <div>writing flow</div>,
		};

		const state = {
			blockTypes: {
				[ name ]: blockType,
			},
		};

		describe.each( [
			[ 'name', name ],
			[ 'block type', blockType ],
			[ 'block type without category', blockTypeWithoutCategory ],
			[ 'block type without description', blockTypeWithoutDescription ],
			[
				'block type with non-string description',
				blockTypeWithNonStringDescription,
			],
		] )( 'by %s', ( label, nameOrType ) => {
			it( 'should return false if not match', () => {
				const result = isMatchingSearchTerm(
					state,
					nameOrType,
					'Quote'
				);

				expect( result ).toBe( false );
			} );

			it( 'should return true if match by title', () => {
				const result = isMatchingSearchTerm(
					state,
					nameOrType,
					'Paragraph'
				);

				expect( result ).toBe( true );
			} );

			it( 'should return true if match ignoring case', () => {
				const result = isMatchingSearchTerm(
					state,
					nameOrType,
					'PARAGRAPH'
				);

				expect( result ).toBe( true );
			} );

			it( 'should return true if match ignoring diacritics', () => {
				const result = isMatchingSearchTerm(
					state,
					nameOrType,
					'PÁRAGRAPH'
				);

				expect( result ).toBe( true );
			} );

			it( 'should return true if match ignoring whitespace', () => {
				const result = isMatchingSearchTerm(
					state,
					nameOrType,
					'  PARAGRAPH  '
				);

				expect( result ).toBe( true );
			} );

			it( 'should return true if match using the keywords', () => {
				const result = isMatchingSearchTerm(
					state,
					nameOrType,
					'BODY'
				);

				expect( result ).toBe( true );
			} );

			if ( nameOrType.category ) {
				it( 'should return true if match using the categories', () => {
					const result = isMatchingSearchTerm(
						state,
						nameOrType,
						'TEXT'
					);

					expect( result ).toBe( true );
				} );
			}

			if (
				nameOrType.description &&
				typeof nameOrType.description === 'string'
			) {
				it( 'should return true if match using the description', () => {
					const result = isMatchingSearchTerm(
						state,
						nameOrType,
						'flow'
					);

					expect( result ).toBe( true );
				} );
			}
		} );
	} );

	describe( 'getGroupingBlockName', () => {
		it( 'returns the grouping block name from state', () => {
			const state = {
				groupingBlockName: 'core/group',
			};

			expect( getGroupingBlockName( state ) ).toEqual( 'core/group' );
		} );
	} );
} );
