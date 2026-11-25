import { describe, expect, it } from 'vitest';
import { getMenuFilters, isMenuFilter } from '../utils';
import type { NormalizedField, NormalizedFilter, Option } from '../../../types';

type Item = Record< string, unknown >;

const options = ( count: number ): Option[] =>
	Array.from( { length: count }, ( _option, index ) => ( {
		value: `option-${ index }`,
		label: `Option ${ index }`,
	} ) );

function filter(
	field: string,
	props: Partial< NormalizedFilter > = {}
): NormalizedFilter {
	return {
		field,
		name: field,
		elements: options( 3 ),
		hasElements: true,
		singleSelection: true,
		operators: [ 'is' ],
		isVisible: false,
		isPrimary: false,
		isLocked: false,
		...props,
	};
}

const field = ( id: string ) =>
	( { id, label: id } ) as NormalizedField< Item >;

describe( 'isMenuFilter', () => {
	it( 'accepts a filter with a short fixed list where one value is chosen', () => {
		expect( isMenuFilter( filter( 'status' ) ) ).toBe( true );
	} );

	it( 'accepts a filter with a short fixed list where several values are chosen', () => {
		expect(
			isMenuFilter(
				filter( 'tags', {
					singleSelection: false,
					operators: [ 'isAny', 'isNone' ],
				} )
			)
		).toBe( true );
	} );

	it( 'accepts a list of 10 options and rejects a longer one', () => {
		expect(
			isMenuFilter( filter( 'author', { elements: options( 10 ) } ) )
		).toBe( true );
		expect(
			isMenuFilter( filter( 'author', { elements: options( 11 ) } ) )
		).toBe( false );
	} );

	it( 'rejects a filter that has no list of options, such as a date', () => {
		expect(
			isMenuFilter(
				filter( 'date', {
					elements: undefined,
					hasElements: false,
					operators: [ 'on', 'before', 'after' ],
				} )
			)
		).toBe( false );
	} );

	it( 'rejects a filter whose options are loaded on demand', () => {
		expect(
			isMenuFilter(
				filter( 'format', {
					elements: undefined,
					getElements: async () => options( 3 ),
				} )
			)
		).toBe( false );
	} );

	it( 'rejects a filter that is not set by picking among its options', () => {
		expect(
			isMenuFilter(
				filter( 'tags', {
					singleSelection: false,
					operators: [ 'isNone', 'isAll' ],
				} )
			)
		).toBe( false );
	} );

	it( 'rejects a filter the user cannot change', () => {
		expect( isMenuFilter( filter( 'status', { isLocked: true } ) ) ).toBe(
			false
		);
	} );
} );

describe( 'getMenuFilters', () => {
	it( 'keeps the eligible filters in the order their fields were declared', () => {
		const filters = [
			filter( 'author', { elements: options( 12 ) } ),
			filter( 'source' ),
			filter( 'type' ),
		];
		const fields = [
			field( 'type' ),
			field( 'author' ),
			field( 'source' ),
		];

		expect(
			getMenuFilters( filters, fields ).map( ( { field: id } ) => id )
		).toEqual( [ 'type', 'source' ] );
	} );

	it( 'leaves out the excluded fields', () => {
		const filters = [ filter( 'category' ), filter( 'source' ) ];
		const fields = [ field( 'category' ), field( 'source' ) ];

		expect(
			getMenuFilters( filters, fields, [ 'category' ] ).map(
				( { field: id } ) => id
			)
		).toEqual( [ 'source' ] );
	} );
} );
