/**
 * Internal dependencies
 */
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

		expect( singleResult.map( ( { title } ) => title.raw ) ).toEqual( [
			'Single',
			'Single Product',
			'Category',
			'Archive',
		] );
		expect( singleProductResult.map( ( { title } ) => title.raw ) ).toEqual(
			[ 'Single Product', 'Category', 'Archive', 'Single' ]
		);
		expect( categoryResult.map( ( { title } ) => title.raw ) ).toEqual( [
			'Category',
			'Single',
			'Single Product',
			'Archive',
		] );
	} );
} );
