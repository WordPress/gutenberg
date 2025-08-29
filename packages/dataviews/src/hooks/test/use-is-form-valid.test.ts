/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useIsFormValid } from '../';
import type { Field, Form } from '../../types';

describe( 'useIsFormValid', () => {
	const mockItem = {
		id: 1,
		name: 'Test Item',
		description: '',
		isActive: false,
		count: 5,
		email: 'test@example.com',
	};

	const mockFields: Field< typeof mockItem >[] = [
		{
			id: 'name',
			type: 'text',
			label: 'Name',
			isValid: { required: true },
			getValue: ( { item } ) => item.name,
		},
		{
			id: 'description',
			type: 'text',
			label: 'Description',
			getValue: ( { item } ) => item.description,
			isValid: {},
		},
		{
			id: 'isActive',
			type: 'boolean',
			label: 'Active',
			getValue: ( { item } ) => item.isActive,
			isValid: { required: true },
		},
		{
			id: 'count',
			type: 'integer',
			label: 'Count',
			getValue: ( { item } ) => item.count,
			isValid: {
				required: true,
				custom: ( item, field ) => {
					const value = field.getValue( { item } );
					return value < 10 ? null : 'Count must be less than 10';
				},
			},
		},
		{
			id: 'email',
			type: 'email',
			label: 'Email',
			getValue: ( { item } ) => item.email,
			isValid: {
				required: true,
				custom: ( item, field ) => {
					const value = field.getValue( { item } );
					return value.includes( '@' )
						? null
						: 'Invalid email format';
				},
			},
		},
	];

	const mockForm: Form = {
		fields: [ 'name', 'description', 'isActive', 'count', 'email' ],
	};

	it( 'should return error messages for invalid fields', () => {
		const { result } = renderHook( () =>
			useIsFormValid( mockItem, mockFields, mockForm )
		);

		expect( result.current?.[ 0 ] ).toEqual( {
			id: 'isActive',
			required: 'invalid',
		} );
	} );

	it( 'should handle required text fields', () => {
		const item = { ...mockItem, name: '' };
		const { result } = renderHook( () =>
			useIsFormValid( item, mockFields, mockForm )
		);

		expect( result.current?.[ 0 ] ).toEqual( {
			id: 'name',
			required: 'invalid',
		} );
	} );

	it( 'should handle required email fields', () => {
		const item = { ...mockItem, email: '' };
		const { result } = renderHook( () =>
			useIsFormValid( item, mockFields, mockForm )
		);

		expect( result.current?.[ 1 ] ).toEqual( {
			id: 'email',
			required: 'invalid',
		} );
	} );

	it( 'should handle custom validation', () => {
		const item = { ...mockItem, count: 15 };
		const { result } = renderHook( () =>
			useIsFormValid( item, mockFields, mockForm )
		);

		expect( result.current?.[ 1 ] ).toEqual( {
			id: 'count',
			custom: {
				type: 'invalid',
				message: 'Count must be less than 10',
			},
		} );
	} );

	it( 'should handle custom validation for email format', () => {
		const item = { ...mockItem, email: 'invalid-email' };
		const { result } = renderHook( () =>
			useIsFormValid( item, mockFields, mockForm )
		);

		expect( result.current?.[ 1 ] ).toEqual( {
			id: 'email',
			custom: {
				type: 'invalid',
				message: 'Invalid email format',
			},
		} );
	} );

	it( 'should handle form fields as objects', () => {
		const formWithObjects: Form = {
			fields: [
				{ id: 'name' },
				{ id: 'description' },
				{ id: 'isActive' },
				{ id: 'count' },
				{ id: 'email' },
			],
		};

		const { result } = renderHook( () =>
			useIsFormValid( mockItem, mockFields, formWithObjects )
		);

		expect( result.current ).not.toBeUndefined();
		expect( result.current?.[ 0 ] ).toEqual( {
			id: 'isActive',
			required: 'invalid',
		} );
	} );

	it( 'should handle empty form fields', () => {
		const formWithEmptyFields: Form = {
			fields: [],
		};

		const { result } = renderHook( () =>
			useIsFormValid( mockItem, mockFields, formWithEmptyFields )
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return undefined when all fields are valid', () => {
		const validItem = {
			...mockItem,
			isActive: true,
		};

		const { result } = renderHook( () =>
			useIsFormValid( validItem, mockFields, mockForm )
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'should handle undefined form fields', () => {
		const formWithUndefinedFields: Form = {};

		const { result } = renderHook( () =>
			useIsFormValid( mockItem, mockFields, formWithUndefinedFields )
		);

		expect( result.current ).toBeUndefined();
	} );
} );
