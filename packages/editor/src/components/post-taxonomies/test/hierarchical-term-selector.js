/**
 * Internal dependencies
 */
import { sortBySelected } from '../hierarchical-term-selector';

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
