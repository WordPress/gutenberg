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
				commentId: 1,
				children: [
					{
						commentId: 6,
						children: [],
					},
				],
			},
			{
				commentId: 2,
				children: [
					{ commentId: 3, children: [] },
					{
						commentId: 4,
						children: [ { commentId: 5, children: [] } ],
					},
				],
			},
		] );
	} );
} );
