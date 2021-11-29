/**
 * Internal dependencies
 */
import { convertToTree } from '../util';

describe( 'Convert to tree', () => {
	it( 'Empty comments', () => {
		const comments = convertToTree( [] );

		expect( comments ).toEqual( [] );
	} );

	it( 'Handle comments', () => {
		const comments = convertToTree( [
			{ id: 1, parent: 0 },
			{ id: 2, parent: 0 },
			{ id: 3, parent: 2 },
			{ id: 4, parent: 2 },
			{ id: 5, parent: 4 },
			{ id: 6, parent: 1 },
		] );

		expect( comments ).toEqual( [
			{
				id: 1,
				commentId: 1,
				parent: 0,
				children: [
					{
						children: [],
						id: 6,
						commentId: 6,
						parent: 1,
					},
				],
			},
			{
				id: 2,
				commentId: 2,
				parent: 0,
				children: [
					{ children: [], commentId: 3, id: 3, parent: 2 },
					{
						children: [
							{ children: [], commentId: 5, id: 5, parent: 4 },
						],
						id: 4,
						commentId: 4,
						parent: 2,
					},
				],
			},
		] );
	} );
} );
