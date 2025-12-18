/**
 * Internal dependencies
 */
import { generateFieldsFromAttributes } from '../generate-fields-from-attributes';

/**
 * Helper to mark attributes for auto-field generation.
 * In production, this marker is added by PHP during block registration.
 *
 * @param {Object} attrs - Attributes object
 * @return {Object} Attributes with __experimentalAutoField marker
 */
function markForAutoField( attrs ) {
	const result = {};
	for ( const [ name, def ] of Object.entries( attrs ) ) {
		result[ name ] = { ...def, __experimentalAutoField: true };
	}
	return result;
}

describe( 'generateFieldsFromAttributes', () => {
	it( 'should generate text field for string attribute', () => {
		const attributes = markForAutoField( {
			message: {
				type: 'string',
				default: 'Hello',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'message',
			label: 'Message',
			type: 'text',
		} );
		expect( result.form.fields ).toContain( 'message' );
	} );

	it( 'should generate number field for number attribute', () => {
		const attributes = markForAutoField( {
			amount: {
				type: 'number',
				default: 10,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'amount',
			label: 'Amount',
			type: 'number',
		} );
	} );

	it( 'should generate integer field for integer attribute', () => {
		const attributes = markForAutoField( {
			count: {
				type: 'integer',
				default: 5,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'count',
			label: 'Count',
			type: 'integer',
		} );
	} );

	it( 'should generate boolean field for boolean attribute', () => {
		const attributes = markForAutoField( {
			enabled: {
				type: 'boolean',
				default: true,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'enabled',
			label: 'Enabled',
			type: 'boolean',
		} );
	} );

	it( 'should generate text field with elements for enum attribute', () => {
		const attributes = markForAutoField( {
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
			label: 'Size',
			type: 'text',
			elements: [
				{ value: 'small', label: 'Small' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'large', label: 'Large' },
			],
		} );
	} );

	it( 'should exclude attributes with source property', () => {
		const attributes = {
			message: {
				type: 'string',
				default: 'Hello',
				__experimentalAutoField: true,
			},
			content: {
				type: 'string',
				source: 'html',
				__experimentalAutoField: true,
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].id ).toBe( 'message' );
		expect( result.form.fields ).not.toContain( 'content' );
	} );

	it( 'should exclude attributes with role: local', () => {
		const attributes = {
			message: {
				type: 'string',
				default: 'Hello',
				__experimentalAutoField: true,
			},
			internalState: {
				type: 'string',
				role: 'local',
				__experimentalAutoField: true,
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].id ).toBe( 'message' );
		expect( result.form.fields ).not.toContain( 'internalState' );
	} );

	it( 'should skip unsupported attribute types', () => {
		const attributes = markForAutoField( {
			message: {
				type: 'string',
				default: 'Hello',
			},
			items: {
				type: 'array',
				default: [],
			},
			config: {
				type: 'object',
				default: {},
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		// Only string attribute should generate a field
		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].id ).toBe( 'message' );
	} );

	it( 'should handle union types by using the first type', () => {
		const attributes = markForAutoField( {
			value: {
				type: [ 'string', 'null' ],
				default: null,
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].type ).toBe( 'text' );
	} );

	it( 'should humanize camelCase attribute names', () => {
		const attributes = markForAutoField( {
			backgroundColor: {
				type: 'string',
			},
			showTitle: {
				type: 'boolean',
			},
			itemCount: {
				type: 'integer',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].label ).toBe( 'Background Color' );
		expect( result.fields[ 1 ].label ).toBe( 'Show Title' );
		expect( result.fields[ 2 ].label ).toBe( 'Item Count' );
	} );

	it( 'should humanize snake_case attribute names', () => {
		const attributes = markForAutoField( {
			background_color: {
				type: 'string',
			},
			show_title: {
				type: 'boolean',
			},
		} );

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].label ).toBe( 'Background color' );
		expect( result.fields[ 1 ].label ).toBe( 'Show title' );
	} );

	it( 'should return empty fields array for empty attributes', () => {
		const result = generateFieldsFromAttributes( {} );

		expect( result.fields ).toHaveLength( 0 );
		expect( result.form.fields ).toHaveLength( 0 );
	} );

	it( 'should skip attributes without __experimentalAutoField marker', () => {
		const attributes = {
			userDefined: {
				type: 'string',
				__experimentalAutoField: true,
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
		const attributes = markForAutoField( {
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
