/**
 * Internal dependencies
 */
import { filterSortAndPaginate } from '../filter-and-sort-data-view';
import { data, fields } from '../stories/fixtures';

describe( 'filters', () => {
	it( 'should return empty if the data is empty', () => {
		expect( filterSortAndPaginate( null, {}, [] ) ).toStrictEqual( {
			data: [],
			paginationInfo: { totalItems: 0, totalPages: 0 },
		} );
	} );

	it( 'should return the same data if no filters are applied', () => {
		expect(
			filterSortAndPaginate(
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
		const { data: result } = filterSortAndPaginate(
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
		const { data: result } = filterSortAndPaginate(
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

	it( 'should perform case-insensitive and accent-insensitive search', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				search: 'nete ven',
				filters: [],
			},
			fields
		);
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].description ).toBe( 'La planète Vénus' );
	} );

	it( 'should search using IS filter', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'type',
						operator: 'is',
						value: 'Ice giant',
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].title ).toBe( 'Neptune' );
		expect( result[ 1 ].title ).toBe( 'Uranus' );
	} );

	it( 'should search using IS NOT filter', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'type',
						operator: 'isNot',
						value: 'Ice giant',
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 9 );
		expect( result[ 0 ].title ).toBe( 'Apollo' );
		expect( result[ 1 ].title ).toBe( 'Space' );
		expect( result[ 2 ].title ).toBe( 'NASA' );
		expect( result[ 3 ].title ).toBe( 'Mercury' );
		expect( result[ 4 ].title ).toBe( 'Venus' );
		expect( result[ 5 ].title ).toBe( 'Earth' );
		expect( result[ 6 ].title ).toBe( 'Mars' );
		expect( result[ 7 ].title ).toBe( 'Jupiter' );
		expect( result[ 8 ].title ).toBe( 'Saturn' );
	} );

	it( 'should search using IS ANY filter for STRING values', () => {
		const { data: result } = filterSortAndPaginate(
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

	it( 'should search using IS NONE filter for STRING values', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'type',
						operator: 'isNone',
						value: [ 'Ice giant', 'Gas giant', 'Terrestrial' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 3 );
		expect( result[ 0 ].title ).toBe( 'Apollo' );
		expect( result[ 1 ].title ).toBe( 'Space' );
		expect( result[ 2 ].title ).toBe( 'NASA' );
	} );

	it( 'should search using IS ANY filter for ARRAY values', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isAny',
						value: [ 'NASA' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].title ).toBe( 'Apollo' );
		expect( result[ 1 ].title ).toBe( 'NASA' );
	} );

	it( 'should search using IS NONE filter for ARRAY values', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isNone',
						value: [ 'Space' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].title ).toBe( 'NASA' );
	} );

	it( 'should search using IS ALL filter', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isAll',
						value: [ 'Planet', 'Solar system' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 7 );
		expect( result[ 0 ].title ).toBe( 'Neptune' );
		expect( result[ 1 ].title ).toBe( 'Mercury' );
		expect( result[ 2 ].title ).toBe( 'Venus' );
		expect( result[ 3 ].title ).toBe( 'Earth' );
		expect( result[ 4 ].title ).toBe( 'Mars' );
		expect( result[ 5 ].title ).toBe( 'Jupiter' );
		expect( result[ 6 ].title ).toBe( 'Saturn' );
	} );

	it( 'should search using IS NOT ALL filter', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isNotAll',
						value: [ 'Planet', 'Solar system' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 3 );
		expect( result[ 0 ].title ).toBe( 'Apollo' );
		expect( result[ 1 ].title ).toBe( 'Space' );
		expect( result[ 2 ].title ).toBe( 'NASA' );
	} );
} );

describe( 'sorting', () => {
	it( 'should sort', () => {
		const { data: result } = filterSortAndPaginate(
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
		const { data: result, paginationInfo } = filterSortAndPaginate(
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
