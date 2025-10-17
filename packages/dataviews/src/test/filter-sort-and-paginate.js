/**
 * External dependencies
 */
import { subDays, subYears } from 'date-fns';

/**
 * Internal dependencies
 */
import filterSortAndPaginate from '../utils/filter-sort-and-paginate';
import { data, fields } from '../stories/dataviews.fixtures';

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
		expect( result ).toHaveLength( 4 );
		expect(
			result.find( ( item ) => item.name.title === 'Neptune' )
		).toBeDefined();
	} );

	it( 'should search using searchable fields (description)', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				search: 'earth',
				filters: [],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].name.description ).toBe(
			"The Moon is Earth's only natural satellite, orbiting at an average distance of 384,400 kilometers with a synchronous rotation that leads to fixed lunar phases as seen from Earth. Its cratered surface and subtle glow define night skies, inspiring exploration missions and influencing tides and biological rhythms worldwide."
		);
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
		expect( result[ 0 ].name.description ).toBe( 'La planète Vénus' );
	} );

	it( 'should search over array fields when enableGlobalSearch is true', () => {
		const fieldsWithArraySearch = fields.map( ( field ) =>
			field.id === 'categories'
				? { ...field, enableGlobalSearch: true }
				: field
		);

		const { data: result } = filterSortAndPaginate(
			data,
			{
				search: 'Moon',
				filters: [],
			},
			fieldsWithArraySearch
		);

		// Should find items with "Moon" in categories
		expect( result ).toHaveLength( 10 );
		expect( result.map( ( r ) => r.name.title ).sort() ).toContain(
			'Europa'
		);
		expect( result.map( ( r ) => r.name.title ).sort() ).toContain( 'Io' );
		expect( result.map( ( r ) => r.name.title ).sort() ).toContain(
			'Moon'
		);
	} );

	it( 'should search over array fields case-insensitively', () => {
		const fieldsWithArraySearch = fields.map( ( field ) =>
			field.id === 'categories'
				? { ...field, enableGlobalSearch: true }
				: field
		);

		const { data: result } = filterSortAndPaginate(
			data,
			{
				search: 'planet',
				filters: [],
			},
			fieldsWithArraySearch
		);

		// Should find items with "Planet" in categories (case-insensitive)
		expect( result ).toHaveLength( 9 );
		expect( result.map( ( r ) => r.name.title ) ).toContain( 'Neptune' );
		expect( result.map( ( r ) => r.name.title ) ).toContain( 'Mercury' );
		expect( result.map( ( r ) => r.name.title ) ).toContain( 'Earth' );
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
		expect( result[ 0 ].name.title ).toBe( 'Neptune' );
		expect( result[ 1 ].name.title ).toBe( 'Uranus' );
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
		expect( result ).toHaveLength( 17 );
		expect( result[ 0 ].name.title ).toBe( 'Moon' );
		expect( result[ 1 ].name.title ).toBe( 'Io' );
		expect( result[ 2 ].name.title ).toBe( 'Europa' );
		expect( result[ 3 ].name.title ).toBe( 'Ganymede' );
		expect( result[ 4 ].name.title ).toBe( 'Callisto' );
		expect( result[ 5 ].name.title ).toBe( 'Amalthea' );
		expect( result[ 6 ].name.title ).toBe( 'Himalia' );
		expect( result[ 7 ].name.title ).toBe( 'Triton' );
		expect( result[ 8 ].name.title ).toBe( 'Nereid' );
		expect( result[ 9 ].name.title ).toBe( 'Proteus' );
		expect( result[ 10 ].name.title ).toBe( 'Mercury' );
		expect( result[ 11 ].name.title ).toBe( 'Venus' );
		expect( result[ 12 ].name.title ).toBe( 'Earth' );
		expect( result[ 13 ].name.title ).toBe( 'Mars' );
		expect( result[ 14 ].name.title ).toBe( 'Jupiter' );
		expect( result[ 15 ].name.title ).toBe( 'Saturn' );
		expect( result[ 16 ].name.title ).toBe(
			'Thessalonikopolymnianebuchodonossarinacharybdis'
		);
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
		expect( result[ 0 ].name.title ).toBe( 'Neptune' );
		expect( result[ 1 ].name.title ).toBe( 'Uranus' );
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
		expect( result ).toHaveLength( 11 );
		expect( result[ 0 ].name.title ).toBe( 'Moon' );
		expect( result[ 1 ].name.title ).toBe( 'Io' );
		expect( result[ 2 ].name.title ).toBe( 'Europa' );
		expect( result[ 3 ].name.title ).toBe( 'Ganymede' );
		expect( result[ 4 ].name.title ).toBe( 'Callisto' );
		expect( result[ 5 ].name.title ).toBe( 'Amalthea' );
		expect( result[ 6 ].name.title ).toBe( 'Himalia' );
		expect( result[ 7 ].name.title ).toBe( 'Triton' );
		expect( result[ 8 ].name.title ).toBe( 'Nereid' );
		expect( result[ 9 ].name.title ).toBe( 'Proteus' );
		expect( result[ 10 ].name.title ).toBe(
			'Thessalonikopolymnianebuchodonossarinacharybdis'
		);
	} );

	it( 'should search using IS ANY filter for ARRAY values', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isAny',
						value: [ 'Earth' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].name.title ).toBe( 'Moon' );
		expect( result[ 1 ].name.title ).toBe( 'Earth' );
	} );

	it( 'should search using IS NONE filter for ARRAY values', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isNone',
						value: [ 'Terrestrial' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 15 );
		expect( result[ 0 ].name.title ).toBe( 'Moon' );
		expect( result[ 1 ].name.title ).toBe( 'Io' );
		expect( result[ 2 ].name.title ).toBe( 'Europa' );
		expect( result[ 3 ].name.title ).toBe( 'Ganymede' );
		expect( result[ 4 ].name.title ).toBe( 'Callisto' );
		expect( result[ 5 ].name.title ).toBe( 'Amalthea' );
		expect( result[ 6 ].name.title ).toBe( 'Himalia' );
		expect( result[ 7 ].name.title ).toBe( 'Neptune' );
		expect( result[ 8 ].name.title ).toBe( 'Triton' );
		expect( result[ 9 ].name.title ).toBe( 'Nereid' );
		expect( result[ 10 ].name.title ).toBe( 'Proteus' );
		expect( result[ 11 ].name.title ).toBe( 'Jupiter' );
		expect( result[ 12 ].name.title ).toBe( 'Saturn' );
		expect( result[ 13 ].name.title ).toBe( 'Uranus' );
		expect( result[ 14 ].name.title ).toBe(
			'Thessalonikopolymnianebuchodonossarinacharybdis'
		);
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
		expect( result ).toHaveLength( 8 );
		expect( result[ 0 ].name.title ).toBe( 'Neptune' );
		expect( result[ 1 ].name.title ).toBe( 'Mercury' );
		expect( result[ 2 ].name.title ).toBe( 'Venus' );
		expect( result[ 3 ].name.title ).toBe( 'Earth' );
		expect( result[ 4 ].name.title ).toBe( 'Mars' );
		expect( result[ 5 ].name.title ).toBe( 'Jupiter' );
		expect( result[ 6 ].name.title ).toBe( 'Saturn' );
		expect( result[ 7 ].name.title ).toBe( 'Uranus' );
	} );

	it( 'should search using IS NOT ALL filter', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'categories',
						operator: 'isNotAll',
						value: [ 'Planet' ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 10 );
		expect( result[ 0 ].name.title ).toBe( 'Moon' );
		expect( result[ 1 ].name.title ).toBe( 'Io' );
		expect( result[ 2 ].name.title ).toBe( 'Europa' );
		expect( result[ 3 ].name.title ).toBe( 'Ganymede' );
		expect( result[ 4 ].name.title ).toBe( 'Callisto' );
		expect( result[ 5 ].name.title ).toBe( 'Amalthea' );
		expect( result[ 6 ].name.title ).toBe( 'Himalia' );
		expect( result[ 7 ].name.title ).toBe( 'Triton' );
		expect( result[ 8 ].name.title ).toBe( 'Nereid' );
		expect( result[ 9 ].name.title ).toBe( 'Proteus' );
	} );

	it( 'should search using IS filter and return all values if filter.value is undefined', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'type',
						operator: 'is',
						value: undefined,
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 19 );
		expect( result[ 0 ].name.title ).toBe( 'Moon' );
		expect( result[ 1 ].name.title ).toBe( 'Io' );
		expect( result[ 2 ].name.title ).toBe( 'Europa' );
		expect( result[ 3 ].name.title ).toBe( 'Ganymede' );
		expect( result[ 4 ].name.title ).toBe( 'Callisto' );
		expect( result[ 5 ].name.title ).toBe( 'Amalthea' );
		expect( result[ 6 ].name.title ).toBe( 'Himalia' );
		expect( result[ 7 ].name.title ).toBe( 'Neptune' );
		expect( result[ 8 ].name.title ).toBe( 'Triton' );
		expect( result[ 9 ].name.title ).toBe( 'Nereid' );
		expect( result[ 10 ].name.title ).toBe( 'Proteus' );
		expect( result[ 11 ].name.title ).toBe( 'Mercury' );
		expect( result[ 12 ].name.title ).toBe( 'Venus' );
		expect( result[ 13 ].name.title ).toBe( 'Earth' );
		expect( result[ 14 ].name.title ).toBe( 'Mars' );
		expect( result[ 15 ].name.title ).toBe( 'Jupiter' );
		expect( result[ 16 ].name.title ).toBe( 'Saturn' );
		expect( result[ 17 ].name.title ).toBe( 'Uranus' );
		expect( result[ 18 ].name.title ).toBe(
			'Thessalonikopolymnianebuchodonossarinacharybdis'
		);
	} );

	it( 'should filter using LESS THAN operator for integer', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'lessThan',
						value: 2,
					},
				],
			},
			fields
		);
		expect( result.every( ( item ) => item.satellites < 2 ) ).toBe( true );
	} );

	it( 'should filter using GREATER THAN operator for integer', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'greaterThan',
						value: 10,
					},
				],
			},
			fields
		);
		expect( result.every( ( item ) => item.satellites > 10 ) ).toBe( true );
	} );

	it( 'should filter using LESS THAN OR EQUAL operator for integer', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'lessThanOrEqual',
						value: 1,
					},
				],
			},
			fields
		);
		expect( result.every( ( item ) => item.satellites <= 1 ) ).toBe( true );
	} );

	it( 'should filter using GREATER THAN OR EQUAL operator for integer', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'greaterThanOrEqual',
						value: 27,
					},
				],
			},
			fields
		);
		expect( result.every( ( item ) => item.satellites >= 27 ) ).toBe(
			true
		);
	} );

	it( 'should filter using CONTAINS operator for text fields', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'title',
						operator: 'contains',
						value: 'nep',
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].name.title ).toBe( 'Neptune' );
	} );

	it( 'should filter using NOT_CONTAINS operator for text fields', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'description',
						operator: 'notContains',
						value: 'Solar system',
					},
				],
			},
			fields
		);
		// Should return items that don't contain "Solar system" in description
		expect( result ).toHaveLength( 12 );
		expect(
			result.filter( ( r ) =>
				r.name.description.includes( 'Solar system' )
			)
		).toHaveLength( 0 );
		expect( result.map( ( r ) => r.name.title ).sort() ).toEqual( [
			'Amalthea',
			'Callisto',
			'Europa',
			'Ganymede',
			'Himalia',
			'Io',
			'Moon',
			'Nereid',
			'Proteus',
			'Thessalonikopolymnianebuchodonossarinacharybdis',
			'Triton',
			'Venus',
		] );
	} );

	it( 'should filter using STARTS_WITH operator for text fields', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'title',
						operator: 'startsWith',
						value: 'Mar',
					},
				],
			},
			fields
		);
		expect( result.map( ( r ) => r.name.title ) ).toContain( 'Mars' );
	} );

	it( 'should filter using BEFORE operator for datetime', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'before',
						value: '2020-01-01',
					},
				],
			},
			fields
		);
		expect(
			result.every(
				( item ) => new Date( item.date ) < new Date( '2020-01-01' )
			)
		).toBe( true );
	} );

	it( 'should filter using AFTER operator for datetime', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'after',
						value: '2020-01-01',
					},
				],
			},
			fields
		);
		expect(
			result.every(
				( item ) => new Date( item.date ) > new Date( '2020-01-01' )
			)
		).toBe( true );
	} );

	it( 'should filter using BEFORE (inc) operator for datetime', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'beforeInc',
						value: '2020-01-01',
					},
				],
			},
			fields
		);
		expect(
			result.every(
				( item ) => new Date( item.date ) <= new Date( '2020-01-01' )
			)
		).toBe( true );
	} );

	it( 'should filter using AFTER (inc) operator for datetime', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'afterInc',
						value: '2020-01-01',
					},
				],
			},
			fields
		);
		expect(
			result.every(
				( item ) => new Date( item.date ) >= new Date( '2020-01-01' )
			)
		).toBe( true );
	} );

	it( 'should filter using ON operator for datetime with exact date match', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'on',
						value: '2020-01-01',
					},
				],
			},
			fields
		);
		expect( result.length ).toBe( 2 );
		expect( result[ 0 ].name.title ).toBe( 'Neptune' );
	} );

	it( 'should filter using ON operator for datetime with different date formats', () => {
		// Test that '2019-03-01T00:00:00Z' matches '2019-03-01'
		const testData = [
			{ title: 'Test Item 1', date: '2019-03-01T00:00:00Z' },
			{ title: 'Test Item 2', date: '2019-03-02' },
		];
		const testFields = [
			{
				id: 'date',
				type: 'datetime',
				getValue: ( { item } ) => item.date,
			},
		];

		const { data: result } = filterSortAndPaginate(
			testData,
			{
				filters: [
					{
						field: 'date',
						operator: 'on',
						value: '2019-03-01',
					},
				],
			},
			testFields
		);
		expect( result.length ).toBe( 1 );
		expect( result[ 0 ].title ).toBe( 'Test Item 1' );
	} );

	it( 'should filter using NOT_ON operator for datetime', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'notOn',
						value: '2020-01-01',
					},
				],
			},
			fields
		);
		expect( result.length ).toBe( 17 );
		expect( result.map( ( r ) => r.name.title ) ).not.toContain(
			'Neptune'
		);
	} );

	it( 'should filter using NOT_ON operator for datetime with different date formats', () => {
		// Test that '2019-03-01T00:00:00Z' does not match '2019-03-02'
		const testData = [
			{ title: 'Test Item 1', date: '2019-03-01T00:00:00Z' },
			{ title: 'Test Item 2', date: '2019-03-02T00:00:00Z' },
		];
		const testFields = [
			{
				id: 'date',
				type: 'datetime',
				getValue: ( { item } ) => item.date,
			},
		];

		const { data: result } = filterSortAndPaginate(
			testData,
			{
				filters: [
					{
						field: 'date',
						operator: 'notOn',
						value: '2019-03-01',
					},
				],
			},
			testFields
		);
		expect( result.length ).toBe( 1 );
		expect( result[ 0 ].title ).toBe( 'Test Item 2' );
	} );

	it( 'should filter numbers inclusively between min and max using BETWEEN operator', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'between',
						value: [ 10, 30 ],
					},
				],
			},
			fields
		);
		expect( result.map( ( r ) => r.name.title ).sort() ).toEqual( [
			'Neptune',
			'Uranus',
		] );
	} );

	it( 'should filter numbers inclusively at the edges using BETWEEN operator', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'between',
						value: [ 28, 28 ],
					},
				],
			},
			fields
		);
		expect( result.map( ( r ) => r.name.title ) ).toEqual( [ 'Uranus' ] );
	} );

	it( 'should filter decimal numbers within narrow BETWEEN ranges', () => {
		const decimalData = [
			{ id: 1, price: 2.42 },
			{ id: 2, price: 2.58 },
			{ id: 3, price: 3.1 },
		];
		const decimalFields = [
			{
				id: 'price',
				type: 'number',
				getValue: ( { item } ) => item.price,
				filterBy: {
					operators: [ 'between' ],
				},
			},
		];

		const { data: result } = filterSortAndPaginate(
			decimalData,
			{
				filters: [
					{
						field: 'price',
						operator: 'between',
						value: [ 2.4, 2.6 ],
					},
				],
			},
			decimalFields
		);

		expect( result.map( ( r ) => r.id ).sort() ).toEqual( [ 1, 2 ] );
	} );

	it( 'should filter dates inclusively between min and max using BETWEEN operator', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'date',
						operator: 'between',
						value: [ '1977-08-20', '1989-08-25' ],
					},
				],
			},
			fields
		);
		const allInRange = result.every(
			( r ) => r.date >= '1977-08-20' && r.date <= '1989-08-25'
		);
		expect( allInRange ).toBe( true );
	} );

	it( 'should return no results if min > max using BETWEEN operator', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				filters: [
					{
						field: 'satellites',
						operator: 'between',
						value: [ 30, 10 ],
					},
				],
			},
			fields
		);
		expect( result ).toHaveLength( 0 );
	} );

	it( 'should filter using IN_THE_PAST operator for datetime (days)', () => {
		const testData = [
			{ title: 'Recent', date: subDays( new Date(), 5 ) },
			{ title: 'Old', date: subDays( new Date(), 14 ) },
		];
		const testFields = [ { id: 'date', type: 'datetime', label: 'Date' } ];
		const { data: result } = filterSortAndPaginate(
			testData,
			{
				filters: [
					{
						field: 'date',
						operator: 'inThePast',
						value: { value: 7, unit: 'days' },
					},
				],
			},
			testFields
		);
		expect( result ).toHaveLength( 1 );
		expect( result ).toStrictEqual( [ testData[ 0 ] ] );
	} );

	it( 'should filter using OVER operator for datetime (days)', () => {
		const testData = [
			{ title: 'Recent', date: subDays( new Date(), 5 ) },
			{ title: 'Old', date: subDays( new Date(), 14 ) },
		];
		const testFields = [ { id: 'date', type: 'datetime', label: 'Date' } ];
		const { data: result } = filterSortAndPaginate(
			testData,
			{
				filters: [
					{
						field: 'date',
						operator: 'over',
						value: { value: 10, unit: 'days' },
					},
				],
			},
			testFields
		);
		expect( result ).toHaveLength( 1 );
		expect( result ).toStrictEqual( [ testData[ 1 ] ] );
	} );

	it( 'should filter using IN_THE_PAST operator for datetime (years)', () => {
		const testData = [
			{ title: 'Recent', date: subYears( new Date(), 1 ) },
			{ title: 'Old', date: subYears( new Date(), 5 ) },
		];
		const testFields = [ { id: 'date', type: 'datetime', label: 'Date' } ];
		const { data: result } = filterSortAndPaginate(
			testData,
			{
				filters: [
					{
						field: 'date',
						operator: 'inThePast',
						value: { value: 3, unit: 'years' },
					},
				],
			},
			testFields
		);
		expect( result ).toHaveLength( 1 );
		expect( result ).toStrictEqual( [ testData[ 0 ] ] );
	} );

	it( 'should filter using OVER operator for datetime (years)', () => {
		const testData = [
			{ title: 'Recent', date: subYears( new Date(), 1 ) },
			{ title: 'Old', date: subYears( new Date(), 5 ) },
		];
		const testFields = [ { id: 'date', type: 'datetime', label: 'Date' } ];
		const { data: result } = filterSortAndPaginate(
			testData,
			{
				filters: [
					{
						field: 'date',
						operator: 'over',
						value: { value: 3, unit: 'years' },
					},
				],
			},
			testFields
		);
		expect( result ).toHaveLength( 1 );
		expect( result ).toStrictEqual( [ testData[ 1 ] ] );
	} );
} );

describe( 'sorting', () => {
	it( 'should sort by groupByField first, then by sort.field', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				sort: { field: 'title', direction: 'desc' },
				groupByField: 'type',
			},
			fields
		);

		expect( result ).toHaveLength( 19 );

		expect( result[ 0 ].type ).toBe( 'Gas giant' );
		expect( result[ 0 ].name.title ).toBe( 'Saturn' );
		expect( result[ 1 ].type ).toBe( 'Gas giant' );
		expect( result[ 1 ].name.title ).toBe( 'Jupiter' );

		expect( result[ 2 ].type ).toBe( 'Ice giant' );
		expect( result[ 2 ].name.title ).toBe( 'Uranus' );
		expect( result[ 3 ].type ).toBe( 'Ice giant' );
		expect( result[ 3 ].name.title ).toBe( 'Neptune' );

		// All satellites should be grouped together
		const satelliteItems = result.filter(
			( item ) => item.type === 'Satellite'
		);
		expect( satelliteItems ).toHaveLength( 10 );
		expect( satelliteItems[ 0 ].name.title ).toBe( 'Triton' );
		expect( satelliteItems[ 1 ].name.title ).toBe( 'Proteus' );
		expect( satelliteItems[ 2 ].name.title ).toBe( 'Nereid' );
		expect( satelliteItems[ 3 ].name.title ).toBe( 'Moon' );
		expect( satelliteItems[ 4 ].name.title ).toBe( 'Io' );
		expect( satelliteItems[ 5 ].name.title ).toBe( 'Himalia' );
		expect( satelliteItems[ 6 ].name.title ).toBe( 'Ganymede' );
		expect( satelliteItems[ 7 ].name.title ).toBe( 'Europa' );
		expect( satelliteItems[ 8 ].name.title ).toBe( 'Callisto' );
		expect( satelliteItems[ 9 ].name.title ).toBe( 'Amalthea' );

		// All terrestrial planets should be grouped together
		const terrestrialItems = result.filter(
			( item ) => item.type === 'Terrestrial'
		);
		expect( terrestrialItems ).toHaveLength( 4 );
		expect( terrestrialItems[ 0 ].name.title ).toBe( 'Venus' );
		expect( terrestrialItems[ 1 ].name.title ).toBe( 'Mercury' );
		expect( terrestrialItems[ 2 ].name.title ).toBe( 'Mars' );
		expect( terrestrialItems[ 3 ].name.title ).toBe( 'Earth' );
	} );

	it( 'should sort integer field types', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				sort: { field: 'satellites', direction: 'desc' },
			},
			fields
		);

		expect( result ).toHaveLength( 19 );
		expect( result[ 0 ].name.title ).toBe( 'Saturn' );
		expect( result[ 1 ].name.title ).toBe( 'Jupiter' );
		expect( result[ 2 ].name.title ).toBe( 'Uranus' );
	} );

	it( 'should sort text field types', () => {
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
		expect( result[ 0 ].name.title ).toBe( 'Uranus' );
		expect( result[ 1 ].name.title ).toBe( 'Neptune' );
	} );

	it( 'should sort datetime field types', () => {
		const { data: resultDesc } = filterSortAndPaginate(
			data,
			{
				sort: { field: 'date', direction: 'desc' },
			},
			fields
		);
		expect( resultDesc ).toHaveLength( 19 );
		expect( resultDesc[ 0 ].name.title ).toBe( 'Europa' );
		expect( resultDesc[ 1 ].name.title ).toBe( 'Earth' );
		// Skip intermediate items
		expect( resultDesc[ resultDesc.length - 2 ].name.title ).toBe( 'Io' );
		expect( resultDesc[ resultDesc.length - 1 ].name.title ).toBe(
			'Jupiter'
		);

		const { data: resultAsc } = filterSortAndPaginate(
			data,
			{
				sort: { field: 'date', direction: 'asc' },
			},
			fields
		);
		expect( resultAsc ).toHaveLength( 19 );
		expect( resultAsc[ 0 ].name.title ).toBe( 'Jupiter' );
		expect( resultAsc[ 1 ].name.title ).toBe( 'Io' );
		// Skip intermediate items
		expect( resultAsc[ resultAsc.length - 2 ].name.title ).toBe( 'Earth' );
		expect( resultAsc[ resultAsc.length - 1 ].name.title ).toBe( 'Europa' );
	} );

	it( 'should sort untyped fields if the value is a number', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				sort: { field: 'satellites', direction: 'desc' },
			},
			// Remove type information for satellites field to test sorting untyped fields.
			fields.map( ( field ) =>
				field.id === 'satellites'
					? { ...field, type: undefined }
					: field
			)
		);

		expect( result ).toHaveLength( 19 );
		expect( result[ 0 ].name.title ).toBe( 'Saturn' );
		expect( result[ 1 ].name.title ).toBe( 'Jupiter' );
		expect( result[ 2 ].name.title ).toBe( 'Uranus' );
	} );

	it( 'should sort untyped fields if the value is string', () => {
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
			// Remove type information for the title field to test sorting untyped fields.
			fields.map( ( field ) =>
				field.id === 'title' ? { ...field, type: undefined } : field
			)
		);
		expect( result ).toHaveLength( 2 );
		expect( result[ 0 ].name.title ).toBe( 'Uranus' );
		expect( result[ 1 ].name.title ).toBe( 'Neptune' );
	} );

	it( 'should sort only by groupByField when sort is not specified', () => {
		const { data: result } = filterSortAndPaginate(
			data,
			{
				groupByField: 'type',
			},
			fields
		);

		let currentType = result[ 0 ].type;
		let groupCount = 1;

		for ( let i = 1; i < result.length; i++ ) {
			if ( result[ i ].type !== currentType ) {
				currentType = result[ i ].type;
				groupCount++;
			}
		}

		expect( groupCount ).toBe( 5 );
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
		expect( result[ 0 ].name.title ).toBe( 'Europa' );
		expect( result[ 1 ].name.title ).toBe( 'Ganymede' );
		expect( paginationInfo ).toStrictEqual( {
			totalItems: data.length,
			totalPages: 10,
		} );
	} );
} );
