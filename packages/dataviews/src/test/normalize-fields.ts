/**
 * Internal dependencies
 */
import normalizeFields from '../field-types/utils/normalize-fields';
import type { Field } from '../types';

describe( 'normalizeFields: default getValue', () => {
	describe( 'getValue from ID', () => {
		it( 'user', () => {
			const item = { user: 'value' };
			const fields: Field< {} >[] = [
				{
					id: 'user',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].getValue( { item } );
			expect( result ).toBe( 'value' );
		} );

		it( 'user.name', () => {
			const item = { user: { name: 'value' } };
			const fields: Field< {} >[] = [
				{
					id: 'user.name',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].getValue( { item } );
			expect( result ).toBe( 'value' );
		} );

		it( 'user.name.first', () => {
			const item = { user: { name: { first: 'value' } } };
			const fields: Field< {} >[] = [
				{
					id: 'user.name.first',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].getValue( { item } );
			expect( result ).toBe( 'value' );
		} );
	} );
	describe( 'setValue from ID', () => {
		it( 'user', () => {
			const item = { user: 'value', email: 'user@example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'user',
				},
				{
					id: 'email',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].setValue( {
				item,
				value: 'newValue',
			} );
			expect( result ).toEqual( { user: 'newValue' } );
		} );

		it( 'user.name', () => {
			const item = {
				user: { name: 'value', email: 'user@example.com' },
				date: '2023-01-01',
			};
			const fields: Field< {} >[] = [
				{
					id: 'user.name',
				},
				{
					id: 'user.email',
				},
				{
					id: 'date',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].setValue( {
				item,
				value: 'newValue',
			} );
			expect( result ).toEqual( { user: { name: 'newValue' } } );
		} );

		it( 'user.name.first', () => {
			const item = {
				user: {
					name: { first: 'firstName', last: 'lastName' },
					email: 'user@example.com',
				},
				date: '2023-01-01',
			};
			const fields: Field< {} >[] = [
				{
					id: 'user.name.first',
				},
				{
					id: 'user.name.last',
				},
				{
					id: 'user.email',
				},
				{
					id: 'date',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].setValue( {
				item,
				value: 'newValue',
			} );
			expect( result ).toEqual( {
				user: {
					name: { first: 'newValue' },
				},
			} );
		} );

		it( 'returns null for null value', () => {
			const item = { user: 'value', email: 'user@example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'user',
				},
				{
					id: 'email',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].setValue( {
				item,
				value: null,
			} );
			expect( result ).toEqual( { user: null } );
		} );

		it( 'returns undefined for undefined value', () => {
			const item = { user: 'value', email: 'user@example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'user',
				},
				{
					id: 'email',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].setValue( {
				item,
				value: undefined,
			} );
			expect( result ).toEqual( { user: undefined } );
		} );
	} );

	describe( 'filterBy', () => {
		it( 'returns the default field type definition if undefined for untyped field', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: false,
				operators: [ 'is', 'isNot' ],
			} );
		} );
		it( 'returns the default field type definition if undefined for untyped field (for primary filters)', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					filterBy: {
						isPrimary: true,
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: true,
				operators: [ 'is', 'isNot' ],
			} );
		} );

		it( 'returns the field type definition for typed fields', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					type: 'integer',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: false,
				operators: [
					'is',
					'isNot',
					'lessThan',
					'greaterThan',
					'lessThanOrEqual',
					'greaterThanOrEqual',
					'between',
				],
			} );
		} );

		it( 'returns the field type definition for number fields', () => {
			const fields: Field< {} >[] = [
				{
					id: 'price',
					type: 'number',
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: false,
				operators: [
					'is',
					'isNot',
					'lessThan',
					'greaterThan',
					'lessThanOrEqual',
					'greaterThanOrEqual',
					'between',
				],
			} );
		} );

		it( 'returns the field type definition for typed fields (for primary filters)', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					type: 'integer',
					filterBy: {
						isPrimary: true,
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: true,
				operators: [
					'is',
					'isNot',
					'lessThan',
					'greaterThan',
					'lessThanOrEqual',
					'greaterThanOrEqual',
					'between',
				],
			} );
		} );

		it( 'returns false if is false', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					filterBy: false,
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toBe( false );
		} );

		it( 'returns the config if it provides one', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					filterBy: {
						isPrimary: true,
						operators: [ 'is', 'isNot' ],
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: true,
				operators: [ 'is', 'isNot' ],
			} );
		} );

		it( 'returns false if the none of the operators are valid for the type', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					filterBy: {
						// @ts-ignore
						operators: [ 'invalid', 'operator' ],
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toBe( false );
		} );

		it( 'returns false if the list of operators is empty', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					filterBy: {
						operators: [],
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toBe( false );
		} );

		it( 'removes invalid operators for the type', () => {
			const fields: Field< {} >[] = [
				{
					id: 'user',
					type: 'integer',
					filterBy: {
						isPrimary: true,
						// @ts-ignore
						operators: [ 'invalid', 'lessThan' ],
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			const result = normalizedFields[ 0 ].filterBy;
			expect( result ).toStrictEqual( {
				isPrimary: true,
				operators: [ 'lessThan' ],
			} );
		} );
	} );

	describe( 'format normalization', () => {
		it( 'applies default format when not provided for date fields', () => {
			const fields: Field< {} >[] = [
				{
					id: 'publishDate',
					type: 'date',
				},
			];
			const normalizedFields = normalizeFields( fields );
			expect( normalizedFields[ 0 ].format ).toBeDefined();
			expect( normalizedFields[ 0 ].format.date ).toBeDefined();
			expect( typeof normalizedFields[ 0 ].format.date ).toBe( 'string' );
			expect( normalizedFields[ 0 ].format.weekStartsOn ).toBeDefined();
			expect( typeof normalizedFields[ 0 ].format.weekStartsOn ).toBe(
				'string'
			);
		} );

		it( 'preserves custom format when provided', () => {
			const fields: Field< {} >[] = [
				{
					id: 'publishDate',
					type: 'date',
					format: {
						date: 'F j, Y',
						weekStartsOn: 'monday',
					},
				},
			];
			const normalizedFields = normalizeFields( fields );
			expect( normalizedFields[ 0 ].format.date ).toBe( 'F j, Y' );
			expect( normalizedFields[ 0 ].format.weekStartsOn ).toBe(
				'monday'
			);
		} );

		it( 'adds empty format for non-date field types', () => {
			const fields: Field< {} >[] = [
				{
					id: 'title',
					type: 'text',
				},
				{
					id: 'count',
					type: 'integer',
				},
			];
			const normalizedFields = normalizeFields( fields );
			expect( normalizedFields[ 0 ].format ).toEqual( {} );
			expect( normalizedFields[ 1 ].format ).toEqual( {} );
		} );
	} );
} );
