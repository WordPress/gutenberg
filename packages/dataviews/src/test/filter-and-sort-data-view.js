/**
 * Internal dependencies
 */
import { filterAndSortDataView } from '../filter-and-sort-data-view';
import { data, fields } from '../stories/fixtures';

describe( 'filters', () => {
	it( 'should return empty if the data is empty', () => {
		expect( filterAndSortDataView( null, {}, [] ) ).toStrictEqual( {
			data: [],
			paginationInfo: { totalItems: 0, totalPages: 0 },
		} );
	} );

	it( 'should return the same data if no filters are applied', () => {
		expect(
			filterAndSortDataView(
				data,
				{
					filters: [],
				},
				[]
			)
		).toStrictEqual( {
			data,
			paginationInfo: { totalItems: data.length, totalPages: 1 },
		} );
	} );

	it( 'should search using searchable fields (title)', () => {
		const { data: result } = filterAndSortDataView(
			data,
			{
				search: 'Neptu',
				filters: [],
			},
			fields
		);
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].title ).toBe( 'Neptune' );
	} );

	it( 'should search using searchable fields (description)', () => {
		const { data: result } = filterAndSortDataView(
			data,
			{
				search: 'photo',
				filters: [],
			},
			fields
		);
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].description ).toBe( 'NASA photo' );
	} );

	it( 'should search using enumeration filters', () => {
		const { data: result } = filterAndSortDataView(
			data,
			{
				filters: [
					{
						field: 'type',
						operator: 'isAny',
						value: [ 'Ice giant' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].title ).toBe( 'Neptune' );
		expect( result[ 1 ].title ).toBe( 'Uranus' );
	} );
} );

describe( 'sorting', () => {
	it( 'should sort', () => {
		const { data: result } = filterAndSortDataView(
			data,
			{
				sort: { field: 'title', direction: 'desc' },
				filters: [
					{
						field: 'type',
						operator: 'isAny',
						value: [ 'Ice giant' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].title ).toBe( 'Uranus' );
		expect( result[ 1 ].title ).toBe( 'Neptune' );
	} );
} );

describe( 'pagination', () => {
	it( 'should paginate', () => {
		const { data: result, paginationInfo } = filterAndSortDataView(
			data,
			{
				perPage: 2,
				page: 2,
				filters: [],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].title ).toBe( 'NASA' );
		expect( result[ 1 ].title ).toBe( 'Neptune' );
		expect( paginationInfo ).toStrictEqual( {
			totalItems: data.length,
			totalPages: 6,
		} );
	} );
} );
