/**
 * Internal dependencies
 */
import {
	getChildBlockNames,
	isMatchingSearchTerm,
	getGroupingBlockName,
} from '../selectors';

describe( 'selectors', () => {
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
