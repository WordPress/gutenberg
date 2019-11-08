/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getBlockStyles,
	__experimentalGetBlockPatterns,
	getChildBlockNames,
	isMatchingSearchTerm,
	getGroupingBlockName,
} from '../selectors';

describe( 'selectors', () => {
	const blockName = 'block/name';

	describe( 'getBlockStyles', () => {
		const blockStyleName = 'style-name';
		const blockStyle = {
			name: blockStyleName,
			label: 'My Style',
		};

		const secondBlockStyleName = 'style-name';
		const secondBlockStyle = {
			name: secondBlockStyleName,
			label: 'My Second Style',
		};

		it( 'should return undefined if the state is empty', () => {
			const state = deepFreeze( {
				blockTypes: {},
				blockStyles: {},
			} );

			expect( getBlockStyles( state ) ).toBeUndefined();
		} );

		it( 'should return undefined for a given block type with styles when it is not registered', () => {
			const state = deepFreeze( {
				blockTypes: {},
				blockStyles: {
					[ blockName ]: [
						blockStyle,
						secondBlockStyle,
					],
				},
			} );

			expect( getBlockStyles( state, blockName ) ).toBeUndefined();
		} );

		it( 'should return registered block styles for a given block type which is registered', () => {
			const state = deepFreeze( {
				blockTypes: {
					[ blockName ]: {
						name: blockName,
					},
				},
				blockStyles: {
					[ blockName ]: [
						blockStyle,
						secondBlockStyle,
					],
				},
			} );

			expect( getBlockStyles( state, blockName ) ).toEqual(
				[
					blockStyle,
					secondBlockStyle,
				]
			);
		} );

		it( 'should merge registered block styles for a given block type with its definition', () => {
			const thirdBlockStyleName = 'style-name';
			const thirdBlockStyle = {
				name: thirdBlockStyleName,
				label: 'My Third Style',
			};

			const state = deepFreeze( {
				blockTypes: {
					[ blockName ]: {
						name: blockName,
						styles: thirdBlockStyle,
					},
				},
				blockStyles: {
					[ blockName ]: [
						blockStyle,
						secondBlockStyle,
					],
				},
			} );

			expect( getBlockStyles( state, blockName ) ).toEqual(
				[
					thirdBlockStyle,
					blockStyle,
					secondBlockStyle,
				]
			);
		} );
	} );

	describe( '__experimentalGetBlockPatterns', () => {
		const blockPatternName = 'pattern-name';
		const blockPattern = {
			name: blockPatternName,
			label: 'My pattern',
		};

		const secondBlockPatternName = 'second-pattern-name';
		const secondBlockPattern = {
			name: secondBlockPatternName,
			label: 'My Second Pattern',
		};

		it( 'should return undefined if the state is empty', () => {
			const state = deepFreeze( {
				blockTypes: {},
				blockPatterns: {},
			} );

			expect( __experimentalGetBlockPatterns( state ) ).toBeUndefined();
		} );

		it( 'should return undefined for a given block type with patterns when it is not registered', () => {
			const state = deepFreeze( {
				blockTypes: {},
				blockPatterns: {
					[ blockName ]: [
						blockPattern,
						secondBlockPattern,
					],
				},
			} );

			expect( __experimentalGetBlockPatterns( state, blockName ) ).toBeUndefined();
		} );

		it( 'should return registered block patterns for a given block type which is registered', () => {
			const state = deepFreeze( {
				blockTypes: {
					[ blockName ]: {
						name: blockName,
					},
				},
				blockPatterns: {
					[ blockName ]: [
						blockPattern,
						secondBlockPattern,
					],
				},
			} );

			expect( __experimentalGetBlockPatterns( state, blockName ) ).toEqual(
				[
					blockPattern,
					secondBlockPattern,
				]
			);
		} );

		it( 'should merge registered block patterns for a given block type with its definition', () => {
			const thirdBlockPatternName = 'second-pattern-name';
			const thirdBlockPattern = {
				name: thirdBlockPatternName,
				label: 'My Third Pattern',
			};

			const state = deepFreeze( {
				blockTypes: {
					[ blockName ]: {
						name: blockName,
						patterns: thirdBlockPattern,
					},
				},
				blockPatterns: {
					[ blockName ]: [
						blockPattern,
						secondBlockPattern,
					],
				},
			} );

			expect( __experimentalGetBlockPatterns( state, blockName ) ).toEqual(
				[
					thirdBlockPattern,
					blockPattern,
					secondBlockPattern,
				]
			);
		} );
	} );

	describe( 'getChildBlockNames', () => {
		it( 'should return an empty array if state is empty', () => {
			const state = {};

			expect( getChildBlockNames( state, 'parent1' ) ).toHaveLength( 0 );
		} );

		it( 'should return an empty array if no children exist', () => {
			const state = {
				blockTypes: [
					{
						name: 'child1',
						parent: [ 'parent1' ],
					},
					{
						name: 'child2',
						parent: [ 'parent2' ],
					},
					{
						name: 'parent3',
					},
				],
			};

			expect( getChildBlockNames( state, 'parent3' ) ).toHaveLength( 0 );
		} );

		it( 'should return an empty array if the parent block is not found', () => {
			const state = {
				blockTypes: [
					{
						name: 'child1',
						parent: [ 'parent1' ],
					},
					{
						name: 'parent1',
					},
				],
			};

			expect( getChildBlockNames( state, 'parent3' ) ).toHaveLength( 0 );
		} );

		it( 'should return an array with the child block names', () => {
			const state = {
				blockTypes: [
					{
						name: 'child1',
						parent: [ 'parent1' ],
					},
					{
						name: 'child2',
						parent: [ 'parent2' ],
					},
					{
						name: 'child3',
						parent: [ 'parent1' ],
					},
					{
						name: 'child4',
					},
					{
						name: 'parent1',
					},
					{
						name: 'parent2',
					},
				],
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toEqual( [ 'child1', 'child3' ] );
		} );

		it( 'should return an array with the child block names even if only one child exists', () => {
			const state = {
				blockTypes: [
					{
						name: 'child1',
						parent: [ 'parent1' ],
					},
					{
						name: 'child2',
						parent: [ 'parent2' ],
					},
					{
						name: 'child4',
					},
					{
						name: 'parent1',
					},
					{
						name: 'parent2',
					},
				],
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toEqual( [ 'child1' ] );
		} );

		it( 'should return an array with the child block names even if children have multiple parents', () => {
			const state = {
				blockTypes: [
					{
						name: 'child1',
						parent: [ 'parent1' ],
					},
					{
						name: 'child2',
						parent: [ 'parent1', 'parent2' ],
					},
					{
						name: 'child3',
						parent: [ 'parent1' ],
					},
					{
						name: 'child4',
					},
					{
						name: 'parent1',
					},
					{
						name: 'parent2',
					},
				],
			};

			expect( getChildBlockNames( state, 'parent1' ) ).toEqual( [ 'child1', 'child2', 'child3' ] );
			expect( getChildBlockNames( state, 'parent2' ) ).toEqual( [ 'child2' ] );
		} );
	} );

	describe( 'isMatchingSearchTerm', () => {
		const name = 'core/paragraph';
		const blockType = {
			title: 'Paragraph',
			category: 'common',
			keywords: [ 'text' ],
		};

		const state = {
			blockTypes: {
				[ name ]: blockType,
			},
		};

		describe.each( [
			[ 'name', name ],
			[ 'block type', blockType ],
		] )( 'by %s', ( label, nameOrType ) => {
			it( 'should return false if not match', () => {
				const result = isMatchingSearchTerm( state, nameOrType, 'Quote' );

				expect( result ).toBe( false );
			} );

			it( 'should return true if match by title', () => {
				const result = isMatchingSearchTerm( state, nameOrType, 'Paragraph' );

				expect( result ).toBe( true );
			} );

			it( 'should return true if match ignoring case', () => {
				const result = isMatchingSearchTerm( state, nameOrType, 'PARAGRAPH' );

				expect( result ).toBe( true );
			} );

			it( 'should return true if match ignoring diacritics', () => {
				const result = isMatchingSearchTerm( state, nameOrType, 'PÁRAGRAPH' );

				expect( result ).toBe( true );
			} );

			it( 'should return true if match ignoring whitespace', () => {
				const result = isMatchingSearchTerm( state, nameOrType, '  PARAGRAPH  ' );

				expect( result ).toBe( true );
			} );

			it( 'should return true if match using the keywords', () => {
				const result = isMatchingSearchTerm( state, nameOrType, 'TEXT' );

				expect( result ).toBe( true );
			} );

			it( 'should return true if match using the categories', () => {
				const result = isMatchingSearchTerm( state, nameOrType, 'COMMON' );

				expect( result ).toBe( true );
			} );
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
