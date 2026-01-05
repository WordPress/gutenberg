/**
 * External dependencies
 */
import { renderHook, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useFormValidity } from '../use-form-validity';
import type { Field } from '../../types';

describe( 'useFormValidity', () => {
	describe( 'fields', () => {
		it( 'can override the defaults', () => {
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'not in the form are ignored', () => {
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );
	} );

	describe( 'form fields', () => {
		it( 'defined as strings are checked for validity', () => {
			const item = { id: 1, order: undefined };
			const fields: Field< {} >[] = [
				{
					id: 'order',
					type: 'integer',
					isValid: {
						required: true,
					},
				},
			];
			const form = {
				fields: [ 'order' ],
			};
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( {
				order: {
					required: { type: 'invalid' },
				},
			} );
			expect( isValid ).toBe( false );
		} );

		it( 'defined as objects are checked for validity', () => {
			const item = { id: 1, order: undefined };
			const fields: Field< {} >[] = [
				{
					id: 'order',
					type: 'integer',
					isValid: {
						required: true,
					},
				},
			];
			const form = {
				fields: [ { id: 'order' } ],
			};
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( {
				order: {
					required: { type: 'invalid' },
				},
			} );
			expect( isValid ).toBe( false );
		} );

		it( 'with children are checked for validity', async () => {
			type TestValidity = {
				id: number;
				field1?: number;
				field2?: number;
				field3?: number;
				field4?: number;
			};
			const item: TestValidity = {
				id: 1,
				field1: 2,
				field2: 3,
				field3: undefined,
				field4: undefined,
			};
			const fields: Field< TestValidity >[] = [
				{
					id: 'field1',
					type: 'integer',
					elements: [ { value: 1, label: 'One' } ],
					isValid: {
						elements: true,
					},
				},
				{
					id: 'field2',
					type: 'integer',
					getElements: async () =>
						await new Promise( ( resolve ) => {
							setTimeout( resolve, 5 );
						} ).then( () => [ { value: 2, label: 'Two' } ] ),
					isValid: {
						elements: true,
					},
				},
				{
					id: 'field3',
					type: 'integer',
					isValid: {
						required: true,
					},
				},
				{
					id: 'field4',
					type: 'integer',
					isValid: {
						custom: async () =>
							await new Promise( ( resolve ) =>
								setTimeout( resolve, 5 )
							).then( () => 'Field is invalid.' ),
					},
				},
			];
			const form = {
				fields: [
					'field1',
					{
						id: 'combined1',
						children: [
							'field2',
							{
								id: 'combined2',
								children: [
									'field3',
									{ id: 'combined3', children: [ 'field4' ] },
								],
							},
						],
					},
				],
			};
			const { result } = renderHook( () =>
				useFormValidity( item, fields, form )
			);

			await waitFor( () => {
				expect( result.current ).toEqual( {
					validity: {
						combined1: {
							children: {
								combined2: {
									children: {
										combined3: {
											children: {
												field4: {
													custom: {
														type: 'invalid',
														message:
															'Field is invalid.',
													},
												},
											},
										},
										field3: {
											required: { type: 'invalid' },
										},
									},
								},
								field2: {
									elements: {
										type: 'invalid',
										message:
											'Value must be one of the elements.',
									},
								},
							},
						},
						field1: {
							elements: {
								type: 'invalid',
								message: 'Value must be one of the elements.',
							},
						},
					},
					isValid: false,
				} );
			} );
		} );
	} );

	describe( 'isValid.required', () => {
		const REQUIRED_MESSAGE = {
			required: { type: 'invalid' },
		};

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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.tags ).toEqual( REQUIRED_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.tags ).toEqual( REQUIRED_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );
	} );

	describe( 'isValid.elements', () => {
		const ELEMENTS_MESSAGE = {
			elements: {
				type: 'invalid',
				message: 'Value must be one of the elements.',
			},
		};
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.author ).toEqual( ELEMENTS_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.status ).toEqual( ELEMENTS_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.priority ).toEqual( ELEMENTS_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.price ).toEqual( ELEMENTS_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.tags ).toEqual( ELEMENTS_MESSAGE );
			expect( isValid ).toBe( false );
		} );
	} );

	describe( 'isValid.pattern', () => {
		const PATTERN_MESSAGE = {
			pattern: {
				type: 'invalid',
				message: 'Value does not match the required pattern.',
			},
		};

		it( 'text is valid when value matches the pattern', () => {
			const item = { id: 1, username: 'user_name123' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						pattern: '^[a-zA-Z0-9_]+$',
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'text is invalid when value does not match the pattern', () => {
			const item = { id: 1, username: 'user@name!' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						pattern: '^[a-zA-Z0-9_]+$',
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.username ).toEqual( PATTERN_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'text is valid when value is empty and pattern is defined', () => {
			const item = { id: 1, username: '' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						pattern: '^[a-zA-Z0-9_]+$',
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'email is valid when value matches the pattern', () => {
			const item = { id: 1, email: 'user@company.com' };
			const fields: Field< {} >[] = [
				{
					id: 'email',
					type: 'email',
					isValid: {
						pattern: '^[a-zA-Z0-9]+@company.com$',
					},
				},
			];
			const form = { fields: [ 'email' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'email is invalid when value does not match the pattern', () => {
			const item = { id: 1, email: 'user@other.com' };
			const fields: Field< {} >[] = [
				{
					id: 'email',
					type: 'email',
					isValid: {
						pattern: '^[a-zA-Z0-9]+@company.com$',
					},
				},
			];
			const form = { fields: [ 'email' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.email ).toEqual( PATTERN_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'url is valid when value matches the pattern', () => {
			const item = { id: 1, website: 'https://example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'website',
					type: 'url',
					isValid: {
						pattern: '^https://.*',
					},
				},
			];
			const form = { fields: [ 'website' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'url is invalid when value does not match the pattern', () => {
			const item = { id: 1, website: 'http://example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'website',
					type: 'url',
					isValid: {
						pattern: '^https://.*',
					},
				},
			];
			const form = { fields: [ 'website' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.website ).toEqual( PATTERN_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'telephone is valid when value matches the pattern', () => {
			const item = { id: 1, phone: '+1-555-123-4567' };
			const fields: Field< {} >[] = [
				{
					id: 'phone',
					type: 'telephone',
					isValid: {
						pattern: '^\\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$',
					},
				},
			];
			const form = { fields: [ 'phone' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'telephone is invalid when value does not match the pattern', () => {
			const item = { id: 1, phone: '555-123-4567' };
			const fields: Field< {} >[] = [
				{
					id: 'phone',
					type: 'telephone',
					isValid: {
						pattern: '^\\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$',
					},
				},
			];
			const form = { fields: [ 'phone' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.phone ).toEqual( PATTERN_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'password is valid when value matches the pattern', () => {
			const item = { id: 1, password: 'Abcd1234' };
			const fields: Field< {} >[] = [
				{
					id: 'password',
					type: 'password',
					isValid: {
						pattern: '^[0-9a-zA-Z]{8}$',
					},
				},
			];
			const form = { fields: [ 'password' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'password is invalid when value does not match the pattern', () => {
			const item = { id: 1, password: 'short' };
			const fields: Field< {} >[] = [
				{
					id: 'password',
					type: 'password',
					isValid: {
						pattern: '^[0-9a-zA-Z]{8}$',
					},
				},
			];
			const form = { fields: [ 'password' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.password ).toEqual( PATTERN_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'invalid regex pattern returns error', () => {
			const item = { id: 1, username: 'test' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						pattern: '[invalid(regex',
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.username ).toEqual( {
				pattern: {
					type: 'invalid',
					message: 'Value does not match the required pattern.',
				},
			} );
			expect( isValid ).toBe( false );
		} );
	} );

	describe( 'isValid.min', () => {
		const MIN_MESSAGE = {
			min: {
				type: 'invalid',
				message: 'Value is below the minimum.',
			},
		};

		it( 'integer is valid when value is at min', () => {
			const item = { id: 1, quantity: 5 };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						min: 5,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'integer is valid when value is above min', () => {
			const item = { id: 1, quantity: 10 };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						min: 5,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'integer is invalid when value is below min', () => {
			const item = { id: 1, quantity: 3 };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						min: 5,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.quantity ).toEqual( MIN_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'integer is valid when value is empty and min is defined', () => {
			const item = { id: 1, quantity: undefined };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						min: 5,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'number is valid when value is at or above min', () => {
			const item = { id: 1, price: 9.99 };
			const fields: Field< {} >[] = [
				{
					id: 'price',
					type: 'number',
					isValid: {
						min: 5.5,
					},
				},
			];
			const form = { fields: [ 'price' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'number is invalid when value is below min', () => {
			const item = { id: 1, price: 2.5 };
			const fields: Field< {} >[] = [
				{
					id: 'price',
					type: 'number',
					isValid: {
						min: 5.5,
					},
				},
			];
			const form = { fields: [ 'price' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.price ).toEqual( MIN_MESSAGE );
			expect( isValid ).toBe( false );
		} );
	} );

	describe( 'isValid.max', () => {
		const MAX_MESSAGE = {
			max: {
				type: 'invalid',
				message: 'Value is above the maximum.',
			},
		};

		it( 'integer is valid when value is at max', () => {
			const item = { id: 1, quantity: 100 };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						max: 100,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'integer is valid when value is below max', () => {
			const item = { id: 1, quantity: 50 };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						max: 100,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'integer is invalid when value is above max', () => {
			const item = { id: 1, quantity: 150 };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						max: 100,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.quantity ).toEqual( MAX_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'integer is valid when value is empty and max is defined', () => {
			const item = { id: 1, quantity: undefined };
			const fields: Field< {} >[] = [
				{
					id: 'quantity',
					type: 'integer',
					isValid: {
						max: 100,
					},
				},
			];
			const form = { fields: [ 'quantity' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'number is valid when value is at or below max', () => {
			const item = { id: 1, price: 99.99 };
			const fields: Field< {} >[] = [
				{
					id: 'price',
					type: 'number',
					isValid: {
						max: 100.0,
					},
				},
			];
			const form = { fields: [ 'price' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'number is invalid when value is above max', () => {
			const item = { id: 1, price: 150.5 };
			const fields: Field< {} >[] = [
				{
					id: 'price',
					type: 'number',
					isValid: {
						max: 100.0,
					},
				},
			];
			const form = { fields: [ 'price' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.price ).toEqual( MAX_MESSAGE );
			expect( isValid ).toBe( false );
		} );
	} );

	describe( 'isValid.minLength', () => {
		const MIN_LENGTH_MESSAGE = {
			minLength: {
				type: 'invalid',
				message: 'Value is too short.',
			},
		};

		it( 'text is valid when value length is at minLength', () => {
			const item = { id: 1, username: 'abcde' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						minLength: 5,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'text is valid when value length is above minLength', () => {
			const item = { id: 1, username: 'abcdefghij' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						minLength: 5,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'text is invalid when value length is below minLength', () => {
			const item = { id: 1, username: 'abc' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						minLength: 5,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.username ).toEqual( MIN_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'text is valid when value is empty and minLength is defined', () => {
			const item = { id: 1, username: '' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						minLength: 5,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'email is valid when value length meets minLength', () => {
			const item = { id: 1, email: 'user@example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'email',
					type: 'email',
					isValid: {
						minLength: 10,
					},
				},
			];
			const form = { fields: [ 'email' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'email is invalid when value length is below minLength', () => {
			const item = { id: 1, email: 'a@b.co' };
			const fields: Field< {} >[] = [
				{
					id: 'email',
					type: 'email',
					isValid: {
						minLength: 10,
					},
				},
			];
			const form = { fields: [ 'email' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.email ).toEqual( MIN_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'url is valid when value length meets minLength', () => {
			const item = { id: 1, website: 'https://example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'website',
					type: 'url',
					isValid: {
						minLength: 10,
					},
				},
			];
			const form = { fields: [ 'website' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'url is invalid when value length is below minLength', () => {
			const item = { id: 1, website: 'http://a' };
			const fields: Field< {} >[] = [
				{
					id: 'website',
					type: 'url',
					isValid: {
						minLength: 15,
					},
				},
			];
			const form = { fields: [ 'website' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.website ).toEqual( MIN_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'telephone is valid when value length meets minLength', () => {
			const item = { id: 1, phone: '+1-555-123-4567' };
			const fields: Field< {} >[] = [
				{
					id: 'phone',
					type: 'telephone',
					isValid: {
						minLength: 10,
					},
				},
			];
			const form = { fields: [ 'phone' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'telephone is invalid when value length is below minLength', () => {
			const item = { id: 1, phone: '555' };
			const fields: Field< {} >[] = [
				{
					id: 'phone',
					type: 'telephone',
					isValid: {
						minLength: 10,
					},
				},
			];
			const form = { fields: [ 'phone' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.phone ).toEqual( MIN_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'password is valid when value length meets minLength', () => {
			const item = { id: 1, password: 'securepassword123' };
			const fields: Field< {} >[] = [
				{
					id: 'password',
					type: 'password',
					isValid: {
						minLength: 8,
					},
				},
			];
			const form = { fields: [ 'password' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'password is invalid when value length is below minLength', () => {
			const item = { id: 1, password: 'short' };
			const fields: Field< {} >[] = [
				{
					id: 'password',
					type: 'password',
					isValid: {
						minLength: 8,
					},
				},
			];
			const form = { fields: [ 'password' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.password ).toEqual( MIN_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );
	} );

	describe( 'isValid.maxLength', () => {
		const MAX_LENGTH_MESSAGE = {
			maxLength: {
				type: 'invalid',
				message: 'Value is too long.',
			},
		};

		it( 'text is valid when value length is at maxLength', () => {
			const item = { id: 1, username: 'abcdefghij' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						maxLength: 10,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'text is valid when value length is below maxLength', () => {
			const item = { id: 1, username: 'abc' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						maxLength: 10,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'text is invalid when value length is above maxLength', () => {
			const item = { id: 1, username: 'abcdefghijklmnop' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						maxLength: 10,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.username ).toEqual( MAX_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'text is valid when value is empty and maxLength is defined', () => {
			const item = { id: 1, username: '' };
			const fields: Field< {} >[] = [
				{
					id: 'username',
					type: 'text',
					isValid: {
						maxLength: 10,
					},
				},
			];
			const form = { fields: [ 'username' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'email is valid when value length meets maxLength', () => {
			const item = { id: 1, email: 'user@example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'email',
					type: 'email',
					isValid: {
						maxLength: 50,
					},
				},
			];
			const form = { fields: [ 'email' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'email is invalid when value length is above maxLength', () => {
			const item = { id: 1, email: 'verylongemailaddress@example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'email',
					type: 'email',
					isValid: {
						maxLength: 20,
					},
				},
			];
			const form = { fields: [ 'email' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.email ).toEqual( MAX_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'url is valid when value length meets maxLength', () => {
			const item = { id: 1, website: 'https://example.com' };
			const fields: Field< {} >[] = [
				{
					id: 'website',
					type: 'url',
					isValid: {
						maxLength: 50,
					},
				},
			];
			const form = { fields: [ 'website' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'url is invalid when value length is above maxLength', () => {
			const item = {
				id: 1,
				website: 'https://verylongdomainname.example.com/path',
			};
			const fields: Field< {} >[] = [
				{
					id: 'website',
					type: 'url',
					isValid: {
						maxLength: 30,
					},
				},
			];
			const form = { fields: [ 'website' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.website ).toEqual( MAX_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'telephone is valid when value length meets maxLength', () => {
			const item = { id: 1, phone: '+1-555-123-4567' };
			const fields: Field< {} >[] = [
				{
					id: 'phone',
					type: 'telephone',
					isValid: {
						maxLength: 20,
					},
				},
			];
			const form = { fields: [ 'phone' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'telephone is invalid when value length is above maxLength', () => {
			const item = { id: 1, phone: '+1-555-123-4567-extension-12345' };
			const fields: Field< {} >[] = [
				{
					id: 'phone',
					type: 'telephone',
					isValid: {
						maxLength: 15,
					},
				},
			];
			const form = { fields: [ 'phone' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.phone ).toEqual( MAX_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
		} );

		it( 'password is valid when value length meets maxLength', () => {
			const item = { id: 1, password: 'secure123' };
			const fields: Field< {} >[] = [
				{
					id: 'password',
					type: 'password',
					isValid: {
						maxLength: 20,
					},
				},
			];
			const form = { fields: [ 'password' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
		} );

		it( 'password is invalid when value length is above maxLength', () => {
			const item = { id: 1, password: 'verylongsecurepassword123456' };
			const fields: Field< {} >[] = [
				{
					id: 'password',
					type: 'password',
					isValid: {
						maxLength: 20,
					},
				},
			];
			const form = { fields: [ 'password' ] };
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.password ).toEqual( MAX_LENGTH_MESSAGE );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.order ).toEqual( {
				custom: {
					type: 'invalid',
					message: 'Value must be an integer.',
				},
			} );
			expect( isValid ).toBe( false );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity ).toEqual( undefined );
			expect( isValid ).toBe( true );
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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.price ).toEqual( {
				custom: {
					type: 'invalid',
					message: 'Value must be a number.',
				},
			} );
			expect( isValid ).toBe( false );
		} );

		describe( 'async', () => {
			it( 'is valid when validity object only contains type:valid messages', async () => {
				const item = {
					id: 1,
					title: 'Valid Title',
					status: 'published',
				};
				const fields: Field< {} >[] = [
					{
						id: 'title',
						type: 'text',
						isValid: {
							custom: async () =>
								await new Promise( ( resolve ) =>
									setTimeout( resolve, 5 )
								).then( () => null ),
						},
					},
					{
						id: 'status',
						type: 'text',
						isValid: {
							custom: async () =>
								await new Promise( ( resolve ) =>
									setTimeout( resolve, 5 )
								).then( () => null ),
						},
					},
				];
				const form = { fields: [ 'title', 'status' ] };
				const { result } = renderHook( () =>
					useFormValidity( item, fields, form )
				);

				await waitFor( () => {
					expect( result.current ).toEqual( {
						validity: {
							title: {
								custom: { type: 'valid', message: 'Valid' },
							},
							status: {
								custom: { type: 'valid', message: 'Valid' },
							},
						},
						isValid: true,
					} );
				} );
			} );

			it( 'is invalid and message is "Validating…" when promise is in flight', async () => {
				const item = {
					id: 1,
					title: 'Invalid Title',
					status: 'published',
				};
				const fields: Field< {} >[] = [
					{
						id: 'title',
						type: 'text',
						isValid: {
							// This promise is never resolved.
							// Serves to test in flight behavior of validation.
							custom: async () => await new Promise( () => {} ),
						},
					},
				];
				const form = { fields: [ 'title' ] };
				const { result } = renderHook( () =>
					useFormValidity( item, fields, form )
				);

				await waitFor( () => {
					expect( result.current ).toEqual( {
						validity: {
							title: {
								custom: {
									type: 'validating',
									message: 'Validating…',
								},
							},
						},
						isValid: false,
					} );
				} );
			} );

			it( 'is invalid when validity object contains at least one type:invalid message', async () => {
				const item = {
					id: 1,
					title: 'Invalid Title',
					status: 'published',
				};
				const fields: Field< {} >[] = [
					{
						id: 'title',
						type: 'text',
						isValid: {
							custom: async () =>
								await new Promise( ( resolve ) =>
									setTimeout( resolve, 5 )
								).then( () => 'Title is invalid.' ),
						},
					},
				];
				const form = { fields: [ 'title' ] };
				const { result } = renderHook( () =>
					useFormValidity( item, fields, form )
				);

				await waitFor( () => {
					expect( result.current ).toEqual( {
						validity: {
							title: {
								custom: {
									type: 'invalid',
									message: 'Title is invalid.',
								},
							},
						},
						isValid: false,
					} );
				} );
			} );

			it( 'is invalid when custom returns anything other than null or a string', async () => {
				const item = {
					id: 1,
					title: 'Invalid Title',
					status: 'published',
				};
				const fields: Field< {} >[] = [
					{
						id: 'title',
						type: 'text',
						isValid: {
							// @ts-ignore returns wrong type for testing purposes
							custom: async () =>
								await new Promise( ( resolve ) =>
									setTimeout( resolve, 5 )
								).then( () => 3 ),
						},
					},
				];
				const form = { fields: [ 'title' ] };
				const { result } = renderHook( () =>
					useFormValidity( item, fields, form )
				);

				await waitFor( () => {
					expect( result.current ).toEqual( {
						validity: {
							title: {
								custom: {
									type: 'invalid',
									message:
										'Validation could not be processed.',
								},
							},
						},
						isValid: false,
					} );
				} );
			} );

			it( 'is invalid when promise was rejected', async () => {
				const item = {
					id: 1,
					title: 'Invalid Title',
					status: 'published',
				};
				const fields: Field< {} >[] = [
					{
						id: 'title',
						type: 'text',
						isValid: {
							custom: async () =>
								await new Promise( ( resolve, reject ) =>
									setTimeout(
										() =>
											reject(
												new Error(
													'Validation did not complete successfully.'
												)
											),
										5
									)
								),
						},
					},
				];
				const form = { fields: [ 'title' ] };
				const { result } = renderHook( () =>
					useFormValidity( item, fields, form )
				);

				await waitFor( () => {
					expect( result.current ).toEqual( {
						validity: {
							title: {
								custom: {
									type: 'invalid',
									message:
										'Validation did not complete successfully.',
								},
							},
						},
						isValid: false,
					} );
				} );
			} );
		} );
	} );
} );
