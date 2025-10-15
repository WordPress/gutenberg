/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useIsFormValid } from '../';
import type { Field } from '../../types';

describe( 'useIsFormValid', () => {
	it( 'operates on form fields and ignores the rest', () => {
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
		const { result } = renderHook( () =>
			useIsFormValid( item, fields, form )
		);
		expect( result.current ).toEqual( undefined );
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
		const { result } = renderHook( () =>
			useIsFormValid( item, fields, form )
		);
		expect( result.current ).toEqual( undefined );
	} );

	describe( 'isValid.required', () => {
		const REQUIRED_MESSAGE = {
			required: { type: 'invalid', message: 'Required' },
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.tags ).toEqual( REQUIRED_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.tags ).toEqual( REQUIRED_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current ).toEqual( undefined );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.author ).toEqual( ELEMENTS_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current ).toEqual( undefined );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.status ).toEqual( ELEMENTS_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current ).toEqual( undefined );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.priority ).toEqual( ELEMENTS_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.price ).toEqual( ELEMENTS_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current ).toEqual( undefined );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.tags ).toEqual( ELEMENTS_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.tags ).toEqual( ELEMENTS_MESSAGE );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current ).toEqual( undefined );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.order ).toEqual( {
				custom: {
					type: 'invalid',
					message: 'Value must be an integer.',
				},
			} );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current ).toEqual( undefined );
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
			const { result } = renderHook( () =>
				useIsFormValid( item, fields, form )
			);
			expect( result.current?.price ).toEqual( {
				custom: {
					type: 'invalid',
					message: 'Value must be a number.',
				},
			} );
		} );
	} );
} );
