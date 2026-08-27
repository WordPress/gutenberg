import { render } from '@testing-library/react';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import {
	HierarchicalTermSelector,
	sortBySelected,
	getFilterMatcher,
	findTerm,
} from '../hierarchical-term-selector';

describe( 'sortBySelected', () => {
	test( 'should not change if a term is not selected.', () => {
		const input = [
			{
				id: 2232,
				parent: 0,
				children: [
					{ id: 2245, parent: 2232, children: [] },
					{ id: 2246, parent: 2232, children: [] },
				],
			},
			{ id: 2249, parent: 0, children: [] },
		];
		const tree = sortBySelected( input, [] );
		expect( tree ).toEqual( input );
	} );

	test( 'should place the selected term at the top.', () => {
		const input = [
			{
				id: 2232,
				parent: 0,
				children: [
					{ id: 2245, parent: 2232, children: [] },
					{ id: 2246, parent: 2232, children: [] },
				],
			},
			{ id: 2249, parent: 0, children: [] },
		];

		const output = [
			{ id: 2249, parent: 0, children: [] },
			{
				id: 2232,
				parent: 0,
				children: [
					{ id: 2245, parent: 2232, children: [] },
					{ id: 2246, parent: 2232, children: [] },
				],
			},
		];

		const tree = sortBySelected( input, [ 2249 ] );
		expect( tree ).toEqual( output );
	} );

	test( 'should be moved to the top along with parent if a child term is selected,', () => {
		const input = [
			{ id: 2249, parent: 0, children: [] },
			{
				id: 2232,
				parent: 0,
				children: [
					{ id: 2245, parent: 2232, children: [] },
					{ id: 2246, parent: 2232, children: [] },
				],
			},
		];

		const output = [
			{
				id: 2232,
				parent: 0,
				children: [
					{ id: 2245, parent: 2232, children: [] },
					{ id: 2246, parent: 2232, children: [] },
				],
			},
			{ id: 2249, parent: 0, children: [] },
		];

		const tree = sortBySelected( input, [ 2245 ] );
		expect( tree ).toEqual( output );
	} );
} );

describe( 'findTerm', () => {
	test( 'should be match term', () => {
		const input = [
			{ id: 2249, parent: 0, name: 'single' },
			{ id: 2232, parent: 0, name: 'parent' },
			{ id: 2245, parent: 2232, name: 'child1' },
			{ id: 2246, parent: 2232, name: 'child2' },
		];

		const output = { id: 2232, parent: 0, name: 'parent' };
		expect( findTerm( input, 0, 'parent' ) ).toEqual( output );
	} );

	test( 'should be match child term.', () => {
		const input = [
			{ id: 2249, parent: 0, name: 'single' },
			{ id: 2232, parent: 0, name: 'parent' },
			{ id: 2245, parent: 2232, name: 'child1' },
			{ id: 2246, parent: 2232, name: 'child2' },
		];

		const output = { id: 2245, parent: 2232, name: 'child1' };
		expect( findTerm( input, 2232, 'child1' ) ).toEqual( output );
	} );

	test( 'should be undefined when the wrong parent is specified', () => {
		const input = [
			{ id: 2249, parent: 0, name: 'single' },
			{ id: 2232, parent: 0, name: 'parent' },
			{ id: 2245, parent: 2232, name: 'child1' },
			{ id: 2246, parent: 2232, name: 'child2' },
		];

		expect( findTerm( input, 2249, 'child1' ) ).toEqual( undefined );
	} );
} );

describe( 'getFilterMatcher', () => {
	test( 'should be left with the child', () => {
		const input = {
			id: 2232,
			parent: 0,
			name: 'parent',
			children: [
				{ id: 2245, parent: 2232, name: 'child1', children: [] },
				{ id: 2246, parent: 2232, name: 'child2', children: [] },
			],
		};
		const output = {
			id: 2232,
			parent: 0,
			name: 'parent',
			children: [
				{ id: 2246, parent: 2232, name: 'child2', children: [] },
			],
		};
		const matcher = getFilterMatcher( 'child2' );
		expect( matcher( input ) ).toEqual( output );
	} );

	test( 'should be only parent', () => {
		const input = {
			id: 2232,
			parent: 0,
			name: 'parent',
			children: [
				{ id: 2245, parent: 2232, name: 'child1', children: [] },
				{ id: 2246, parent: 2232, name: 'child2', children: [] },
			],
		};
		const output = {
			id: 2232,
			parent: 0,
			name: 'parent',
			children: [],
		};
		const matcher = getFilterMatcher( 'parent' );
		expect( matcher( input ) ).toEqual( output );
	} );
} );

describe( 'HierarchicalTermSelector', () => {
	it( 'should not read the taxonomy post attribute without an assign action', () => {
		jest.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue( {
			name: 'Types',
			slug: 'type',
			rest_base: 'type',
			hierarchical: true,
		} );
		jest.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			[]
		);
		jest.spyOn( select( coreStore ), 'isResolving' ).mockReturnValue(
			false
		);
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );

		const getEditedPostAttribute = jest
			.spyOn( select( editorStore ), 'getEditedPostAttribute' )
			.mockReturnValue( 'post' );

		render( <HierarchicalTermSelector slug="type" /> );

		expect( getEditedPostAttribute ).not.toHaveBeenCalled();
	} );
} );
