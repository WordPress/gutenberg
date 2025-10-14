/**
 * Internal dependencies
 */
import isItemValid from '../utils/is-item-valid';
import type { Field } from '../types';

describe( 'validation', () => {
	it( 'operates on form fields', () => {
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

	it( 'fields can override the defaults', () => {
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
					elements: false,
					custom: () => null, // Overrides the validation provided for integer types.
				},
			},
		];
		const form = { fields: [ 'order' ] };
		const result = isItemValid( item, fields, form );
		expect( result ).toBe( true );
	} );

	describe( 'isValid.required', () => {
		it( 'array is invalid when required but empty', () => {
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

		it( 'array is invalid when required but not an array', () => {
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

		it( 'array is valid when required and has values', () => {
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
	} );

	describe( 'isValid.elements', () => {
		it( 'untyped is invalid if value is not one of the elements', () => {
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

		it( 'text is valid when value is one of the elements', () => {
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

		it( 'text is invalid when value is not one of the elements', () => {
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

		it( 'integer is valid when value is one of the elements', () => {
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

		it( 'integer is invalid when value is not one of the elements', () => {
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

		it( 'number is invalid if value is not one of the elements', () => {
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

		it( 'array is valid if all items are part of the elements', () => {
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
				},
			];
			const form = { fields: [ 'tags' ] };
			const result = isItemValid( item, fields, form );
			expect( result ).toBe( true );
		} );

		it( 'array is invalid when not all items are part of the elements', () => {
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
				},
			];
			const form = { fields: [ 'tags' ] };
			const result = isItemValid( item, fields, form );
			expect( result ).toBe( false );
		} );

		it( 'array is invalid when value is not an array', () => {
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
						custom: () => null, // Disable to make sure the only validation triggered is elements
					},
				},
			];
			const form = { fields: [ 'tags' ] };
			const result = isItemValid( item, fields, form );
			expect( result ).toBe( false );
		} );
	} );
} );

describe( 'isValid.custom', () => {
	it( 'integer is valid if value is integer', () => {
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

	it( 'integer is invalid if value is not integer when not empty', () => {
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

	it( 'number is valid if value is finite', () => {
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

	it( 'number is invalid if value is not finite when not empty', () => {
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
} );
