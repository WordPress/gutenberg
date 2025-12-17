/**
 * Internal dependencies
 */
import { generateFieldsFromAttributes } from '../generate-fields-from-attributes';

describe( 'generateFieldsFromAttributes', () => {
	it( 'should generate text field for string attribute', () => {
		const attributes = {
			message: {
				type: 'string',
				default: 'Hello',
			},
		};

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
		const attributes = {
			amount: {
				type: 'number',
				default: 10,
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'amount',
			label: 'Amount',
			type: 'number',
		} );
	} );

	it( 'should generate integer field for integer attribute', () => {
		const attributes = {
			count: {
				type: 'integer',
				default: 5,
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'count',
			label: 'Count',
			type: 'integer',
		} );
	} );

	it( 'should generate boolean field for boolean attribute', () => {
		const attributes = {
			enabled: {
				type: 'boolean',
				default: true,
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ] ).toEqual( {
			id: 'enabled',
			label: 'Enabled',
			type: 'boolean',
		} );
	} );

	it( 'should generate text field with elements for enum attribute', () => {
		const attributes = {
			size: {
				type: 'string',
				enum: [ 'small', 'medium', 'large' ],
				default: 'medium',
			},
		};

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
			},
			content: {
				type: 'string',
				source: 'html',
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
			},
			internalState: {
				type: 'string',
				role: 'local',
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].id ).toBe( 'message' );
		expect( result.form.fields ).not.toContain( 'internalState' );
	} );

	it( 'should skip unsupported attribute types', () => {
		const attributes = {
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
		};

		const result = generateFieldsFromAttributes( attributes );

		// Only string attribute should generate a field
		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].id ).toBe( 'message' );
	} );

	it( 'should handle union types by using the first type', () => {
		const attributes = {
			value: {
				type: [ 'string', 'null' ],
				default: null,
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields ).toHaveLength( 1 );
		expect( result.fields[ 0 ].type ).toBe( 'text' );
	} );

	it( 'should humanize camelCase attribute names', () => {
		const attributes = {
			backgroundColor: {
				type: 'string',
			},
			showTitle: {
				type: 'boolean',
			},
			itemCount: {
				type: 'integer',
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].label ).toBe( 'Background Color' );
		expect( result.fields[ 1 ].label ).toBe( 'Show Title' );
		expect( result.fields[ 2 ].label ).toBe( 'Item Count' );
	} );

	it( 'should humanize snake_case attribute names', () => {
		const attributes = {
			background_color: {
				type: 'string',
			},
			show_title: {
				type: 'boolean',
			},
		};

		const result = generateFieldsFromAttributes( attributes );

		expect( result.fields[ 0 ].label ).toBe( 'Background color' );
		expect( result.fields[ 1 ].label ).toBe( 'Show title' );
	} );

	it( 'should return empty fields array for empty attributes', () => {
		const result = generateFieldsFromAttributes( {} );

		expect( result.fields ).toHaveLength( 0 );
		expect( result.form.fields ).toHaveLength( 0 );
	} );

	it( 'should generate multiple fields for multiple attributes', () => {
		const attributes = {
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
		};

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
