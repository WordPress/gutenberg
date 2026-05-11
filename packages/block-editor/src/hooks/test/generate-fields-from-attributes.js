/**
 * Internal dependencies
 */
import { generateFieldsFromAttributes } from '../generate-fields-from-attributes';

/**
 * Helper to mark attributes for auto-generated inspector controls.
 * In production, this marker is added by PHP during block registration.
 *
 * @param {Object} attrs - Attributes object
 * @return {Object} Attributes with autoGenerateControl marker
 */
function markForAutoInspectorControl( attrs ) {
	const result = {};
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
} );
