/**
 * External dependencies
 */
import { renderHook, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useFormValidity } from '../hooks';
import type { Field } from '../types';

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
			const {
				result: {
					current: { validity, isValid },
				},
			} = renderHook( () => useFormValidity( item, fields, form ) );
			expect( validity?.tags ).toEqual( {
				elements: {
					type: 'invalid',
					message: 'Value must be an array.',
				},
			} );
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
