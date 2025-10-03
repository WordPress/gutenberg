/**
 * Internal dependencies
 */
import isItemValid from '../utils/is-item-valid';
import type { Field } from '../types';

describe( 'validation', () => {
	it( 'fields not visible in form are not validated', () => {
		const item = { id: 1, valid_order: 2, invalid_order: 'd' };
		const fields: Field< {} >[] = [
			{
				id: 'valid_order',
				type: 'integer',
			},
			{
				id: 'invalid_order',
				type: 'integer',
			},
		];
		const form = { fields: [ 'valid_order' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'integer field is valid if value is integer', () => {
		const item = { id: 1, order: 2, title: 'hi' };
		const fields: Field< {} >[] = [
			{
				type: 'integer',
				id: 'order',
			},
		];
		const form = { fields: [ 'order' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'integer field is invalid if value is not integer when not empty', () => {
		const item = { id: 1, order: 'd' };
		const fields: Field< {} >[] = [
			{
				id: 'order',
				type: 'integer',
			},
		];
		const form = { fields: [ 'order' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'integer field is invalid if value is not one of the elements', () => {
		const item = { id: 1, author: 3 };
		const fields: Field< {} >[] = [
			{
				id: 'author',
				type: 'integer',
				elements: [
					{ value: 1, label: 'Jane' },
					{ value: 2, label: 'John' },
				],
			},
		];
		const form = { fields: [ 'author' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'number field is valid if value is finite', () => {
		const item = { id: 1, price: 2.5 };
		const fields: Field< {} >[] = [
			{
				id: 'price',
				type: 'number',
			},
		];
		const form = { fields: [ 'price' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'number field is invalid if value is not finite when not empty', () => {
		const item = { id: 1, price: Number.NaN };
		const fields: Field< {} >[] = [
			{
				id: 'price',
				type: 'number',
			},
		];
		const form = { fields: [ 'price' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'number field with elements is invalid if value is not one of the elements', () => {
		const item = { id: 1, price: 4.5 };
		const fields: Field< {} >[] = [
			{
				id: 'price',
				type: 'number',
				elements: [
					{ value: 1.5, label: 'Bronze' },
					{ value: 2.5, label: 'Silver' },
				],
			},
		];
		const form = { fields: [ 'price' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'text field is invalid if value is not one of the elements', () => {
		const item = { id: 1, author: 'not-in-elements' };
		const fields: Field< {} >[] = [
			{
				id: 'author',
				type: 'text',
				elements: [
					{ value: 'jane', label: 'Jane' },
					{ value: 'john', label: 'John' },
				],
			},
		];
		const form = { fields: [ 'author' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'untyped field is invalid if value is not one of the elements', () => {
		const item = { id: 1, author: 'not-in-elements' };
		const fields: Field< {} >[] = [
			{
				id: 'author',
				elements: [
					{ value: 'jane', label: 'Jane' },
					{ value: 'john', label: 'John' },
				],
			},
		];
		const form = { fields: [ 'author' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'fields can provide its own isValid function', () => {
		const item = { id: 1, order: 'd' };
		const fields: Field< {} >[] = [
			{
				id: 'order',
				type: 'integer',
				elements: [
					{ value: 'a', label: 'A' },
					{ value: 'b', label: 'B' },
				],
				isValid: {
					custom: () => null, // Overrides the validation provided for integer types.
				},
			},
		];
		const form = { fields: [ 'order' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'array field is invalid when required but empty', () => {
		const item = { id: 1, tags: [] };
		const fields: Field< {} >[] = [
			{
				id: 'tags',
				type: 'array',
				isValid: {
					required: true,
				},
			},
		];
		const form = { fields: [ 'tags' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'array field is invalid when required but not an array', () => {
		const item = { id: 1, tags: null };
		const fields: Field< {} >[] = [
			{
				id: 'tags',
				type: 'array',
				isValid: {
					required: true,
				},
			},
		];
		const form = { fields: [ 'tags' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'array field is valid when required and has values', () => {
		const item = { id: 1, tags: [ 'tag1', 'tag2' ] };
		const fields: Field< {} >[] = [
			{
				id: 'tags',
				type: 'array',
				isValid: {
					required: true,
				},
			},
		];
		const form = { fields: [ 'tags' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'text field with isValid.elements validates against elements', () => {
		const item = { id: 1, status: 'published' };
		const fields: Field< {} >[] = [
			{
				id: 'status',
				type: 'text',
				elements: [
					{ value: 'draft', label: 'Draft' },
					{ value: 'published', label: 'Published' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'status' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'text field with isValid.elements rejects invalid values', () => {
		const item = { id: 1, status: 'invalid-status' };
		const fields: Field< {} >[] = [
			{
				id: 'status',
				type: 'text',
				elements: [
					{ value: 'draft', label: 'Draft' },
					{ value: 'published', label: 'Published' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'status' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'integer field with isValid.elements validates against elements', () => {
		const item = { id: 1, priority: 2 };
		const fields: Field< {} >[] = [
			{
				id: 'priority',
				type: 'integer',
				elements: [
					{ value: 1, label: 'Low' },
					{ value: 2, label: 'Medium' },
					{ value: 3, label: 'High' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'priority' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'integer field with isValid.elements rejects invalid values', () => {
		const item = { id: 1, priority: 5 };
		const fields: Field< {} >[] = [
			{
				id: 'priority',
				type: 'integer',
				elements: [
					{ value: 1, label: 'Low' },
					{ value: 2, label: 'Medium' },
					{ value: 3, label: 'High' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'priority' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'array field with isValid.elements validates all items against elements', () => {
		const item = { id: 1, tags: [ 'red', 'blue' ] };
		const fields: Field< {} >[] = [
			{
				id: 'tags',
				type: 'array',
				elements: [
					{ value: 'red', label: 'Red' },
					{ value: 'blue', label: 'Blue' },
					{ value: 'green', label: 'Green' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'tags' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	it( 'array field with isValid.elements rejects arrays with invalid items', () => {
		const item = { id: 1, tags: [ 'red', 'yellow' ] };
		const fields: Field< {} >[] = [
			{
				id: 'tags',
				type: 'array',
				elements: [
					{ value: 'red', label: 'Red' },
					{ value: 'blue', label: 'Blue' },
					{ value: 'green', label: 'Green' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'tags' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );

	it( 'array field with isValid.elements handles non-array values', () => {
		const item = { id: 1, tags: 'not-an-array' };
		const fields: Field< {} >[] = [
			{
				id: 'tags',
				type: 'array',
				elements: [
					{ value: 'red', label: 'Red' },
					{ value: 'blue', label: 'Blue' },
				],
				isValid: {
					elements: true,
				},
			},
		];
		const form = { fields: [ 'tags' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( false );
	} );
} );
