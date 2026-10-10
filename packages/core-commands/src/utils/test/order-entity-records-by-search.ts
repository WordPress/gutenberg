import { describe, expect, expectTypeOf, it } from 'vitest';
import { orderEntityRecordsBySearch } from '../order-entity-records-by-search';

const mockData = [
	{
		title: {
			raw: 'Category',
		},
	},
	{
		title: {
			raw: 'Archive',
		},
	},
	{
		title: {
			raw: 'Single',
		},
	},
	{
		title: {
			raw: 'Single Product',
		},
	},
	{
		title: {
			raw: 'Order Confirmation',
		},
	},
];

describe( 'orderEntityRecordsBySearch', () => {
	it( 'should return an empty array if no records are passed', () => {
		expect( orderEntityRecordsBySearch( [], '' ) ).toEqual( [] );
		expect( orderEntityRecordsBySearch( null, '' ) ).toEqual( [] );
	} );

	it( 'should correctly order records by search', () => {
		const singleResult = orderEntityRecordsBySearch( mockData, 'Single' );
		const singleProductResult = orderEntityRecordsBySearch(
			mockData,
			'Single Product'
		);
		const categoryResult = orderEntityRecordsBySearch(
			mockData,
			'Category'
		);
		const orderResult = orderEntityRecordsBySearch( mockData, 'Order' );

		expect( singleResult.map( ( { title } ) => title.raw ) ).toEqual( [
			'Single',
			'Single Product',
			'Category',
			'Archive',
			'Order Confirmation',
		] );
		expect( singleProductResult.map( ( { title } ) => title.raw ) ).toEqual(
			[
				'Single Product',
				'Category',
				'Archive',
				'Single',
				'Order Confirmation',
			]
		);
		expect( categoryResult.map( ( { title } ) => title.raw ) ).toEqual( [
			'Category',
			'Archive',
			'Single',
			'Single Product',
			'Order Confirmation',
		] );
		expect( orderResult.map( ( { title } ) => title.raw ) ).toEqual( [
			'Order Confirmation',
			'Category',
			'Archive',
			'Single',
			'Single Product',
		] );
	} );
	it( 'preserves the original array when the search is empty', () => {
		expect( orderEntityRecordsBySearch( mockData ) ).toBe( mockData );
	} );

	it( 'keeps case-insensitive matches and non-matches in their original order', () => {
		const records = [
			{ id: 1, title: { raw: 'Other' } },
			{ id: 2, title: { raw: 'SINGLE' } },
			{ id: 3 },
			{ id: 4, title: { raw: 'Single Product' } },
			{ id: 5, title: {} },
		];
		const originalRecords = [ ...records ];
		const result = orderEntityRecordsBySearch( records, 'single' );

		expect( result ).toEqual( [
			records[ 1 ],
			records[ 3 ],
			records[ 0 ],
			records[ 2 ],
			records[ 4 ],
		] );
		expect( records ).toEqual( originalRecords );
		expectTypeOf( result ).toEqualTypeOf< typeof records >();
	} );

	it( 'retains the non-array input guard for JavaScript consumers', () => {
		// @ts-expect-error JavaScript callers can pass values outside the typed contract.
		expect( orderEntityRecordsBySearch( {} ) ).toEqual( [] );
	} );
} );
