import { describe, expect, it } from 'vitest';
import { generateFieldsFromAttributes } from '../generate-fields-from-attributes';
import type { AutoGenerateAttribute } from '../types';

/**
 * Helper to mark attributes for auto-generated inspector controls.
 * In production, this marker is added by PHP during block registration.
 *
 * @param attrs - Attributes object
 * @return Attributes with autoGenerateControl marker
 */
function markForAutoInspectorControl(
	attrs: Record< string, AutoGenerateAttribute >
): Record< string, AutoGenerateAttribute > {
	const result: Record< string, AutoGenerateAttribute > = {};
	for ( const [ name, def ] of Object.entries( attrs ) ) {
		result[ name ] = { ...def, autoGenerateControl: true };
	}
	return result;
}

describe( 'generateFieldsFromAttributes', () => {
	it( 'should generate text field for string attribute', () => {
		const attributes = markForAutoInspectorControl( {
			message: {
				type: 'string',
				default: 'Hello',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'message',
			label: 'message',
			type: 'text',
		} );
		expect( result.form.fields ).toContain( 'message' );
	} );

	it( 'should generate number field for number attribute', () => {
		const attributes = markForAutoInspectorControl( {
			amount: {
				type: 'number',
				default: 10,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'amount',
			label: 'amount',
			type: 'number',
		} );
	} );

	it( 'should generate integer field for integer attribute', () => {
		const attributes = markForAutoInspectorControl( {
			count: {
				type: 'integer',
				default: 5,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'count',
			label: 'count',
			type: 'integer',
		} );
	} );

	it( 'should generate boolean field for boolean attribute', () => {
		const attributes = markForAutoInspectorControl( {
			enabled: {
				type: 'boolean',
				default: true,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'enabled',
			label: 'enabled',
			type: 'boolean',
		} );
	} );

	it( 'should generate text field with elements for enum attribute', () => {
		const attributes = markForAutoInspectorControl( {
			size: {
				type: 'string',
				enum: [ 'small', 'medium', 'large' ],
				default: 'medium',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		// DataForm automatically uses a select control when elements are present
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'size',
			label: 'size',
			type: 'text',
			elements: [
				{ value: 'small', label: 'small' },
				{ value: 'medium', label: 'medium' },
				{ value: 'large', label: 'large' },
			],
		} );
	} );

	it( 'should return empty fields array for empty attributes', () => {
		const result = generateFieldsFromAttributes( {} );

		expect( result.fields ).toHaveLength( 0 );
		expect( result.form.fields ).toHaveLength( 0 );
	} );

	it( 'should use custom label when provided', () => {
		const attributes = markForAutoInspectorControl( {
			bgColor: {
				type: 'string',
				label: 'Background Color',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].label ).toBe( 'Background Color' );
	} );

	it( 'should skip attributes without autoGenerateControl marker', () => {
		const attributes = {
			userDefined: {
				type: 'string',
				autoGenerateControl: true,
			},
			supportAdded: {
				type: 'string',
				// No marker = simulate attribute added by block supports
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].id ).toBe( 'userDefined' );
		expect( result.form.fields ).not.toContain( 'supportAdded' );
	} );

	it( 'should generate multiple fields for multiple attributes', () => {
		const attributes = markForAutoInspectorControl( {
			title: {
				type: 'string',
				default: '',
			},
			count: {
				type: 'integer',
				default: 0,
			},
			enabled: {
				type: 'boolean',
				default: false,
			},
			size: {
				type: 'string',
				enum: [ 'small', 'large' ],
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 4 );
		expect( result.form.fields ).toEqual( [
			'title',
			'count',
			'enabled',
			'size',
		] );
	} );

	it( 'should generate an array field with elements for its items', () => {
		const attributes = markForAutoInspectorControl( {
			sizes: {
				type: 'array',
				items: {
					type: 'string',
					enum: [ 'small', 'large' ],
				},
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ] ).toEqual( {
			id: 'sizes',
			label: 'sizes',
			type: 'array',
			elements: [
				{ value: 'small', label: 'small' },
				{ value: 'large', label: 'large' },
			],
		} );
		expect( result.form.fields ).toEqual( [ 'sizes' ] );
	} );

	it( 'should map numeric schema constraints to validation rules', () => {
		const attributes = markForAutoInspectorControl( {
			count: {
				type: 'integer',
				minimum: 1,
				maximum: 10,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].isValid ).toEqual( { min: 1, max: 10 } );
	} );

	it( 'should map string schema constraints to validation rules', () => {
		const attributes = markForAutoInspectorControl( {
			code: {
				type: 'string',
				minLength: 2,
				maxLength: 5,
				pattern: '^[A-Z]+$',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].isValid ).toEqual( {
			minLength: 2,
			maxLength: 5,
			pattern: '^[A-Z]+$',
		} );
	} );

	it( 'should not add validation rules when the schema has no constraints', () => {
		const attributes = markForAutoInspectorControl( {
			count: {
				type: 'integer',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ] ).not.toHaveProperty( 'isValid' );
	} );
} );
