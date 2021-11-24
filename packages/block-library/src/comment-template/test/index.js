import { convertToTree } from '../util';

describe( 'Convert to tree', () => {
	it( 'Empty comments', () => {
		const comments = convertToTree( [] );

		expect( comments ).toMatchInlineSnapshot( `Array []` );
	} );

	it( 'Handle comments', () => {
		const comments = convertToTree( [
			{ commentId: 1, parent: 0 },
			{ commentId: 2, parent: 0 },
			{ commentId: 3, parent: 2 },
			{ commentId: 4, parent: 2 },
			{ commentId: 5, parent: 4 },
			{ commentId: 6, parent: 1 },
		] );

		expect( comments ).toEqual( [
			{
				commentId: 1,
				parent: 0,
				children: [
					{
						children: [],
						commentId: 6,
						parent: 1,
					},
				],
			},
			{
				commentId: 2,
				parent: 0,
				children: [
					{ children: [], commentId: 3, parent: 2 },
					{
						children: [ { children: [], commentId: 5, parent: 4 } ],
						commentId: 4,
						parent: 2,
					},
				],
			},
		] );
	} );
} );
