/**
 * Internal dependencies
 */
import { sanitizeSchema } from '../sanitize-schema';

describe( 'sanitizeSchema', () => {
	it( 'should strip sanitize_callback from properties', () => {
		const schema = {
			type: 'object',
			properties: {
				content: {
					type: 'string',
					sanitize_callback: 'sanitize_text_field',
					description: 'Content to summarize.',
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			properties: {
				content: {
					type: 'string',
					description: 'Content to summarize.',
				},
			},
		} );
	} );

	it( 'should strip validate_callback from properties', () => {
		const schema = {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					validate_callback: 'is_email',
					format: 'email',
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			properties: {
				email: {
					type: 'string',
					format: 'email',
				},
			},
		} );
	} );

	it( 'should strip arg_options from properties', () => {
		const schema = {
			type: 'object',
			properties: {
				title: {
					type: 'string',
					arg_options: {
						sanitize_callback: 'sanitize_text_field',
					},
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			properties: {
				title: {
					type: 'string',
				},
			},
		} );
	} );

	it( 'should recursively sanitize nested schemas in items', () => {
		const schema = {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						sanitize_callback: 'sanitize_text_field',
					},
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
					},
				},
			},
		} );
	} );

	it( 'should recursively sanitize anyOf schemas', () => {
		const schema = {
			anyOf: [
				{
					type: 'string',
					sanitize_callback: 'sanitize_text_field',
				},
				{ type: 'number' },
			],
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			anyOf: [ { type: 'string' }, { type: 'number' } ],
		} );
	} );

	it( 'should recursively sanitize oneOf schemas', () => {
		const schema = {
			oneOf: [
				{
					type: 'string',
					validate_callback: 'is_string',
				},
				{ type: 'number' },
			],
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			oneOf: [ { type: 'string' }, { type: 'number' } ],
		} );
	} );

	it( 'should recursively sanitize additionalProperties schema', () => {
		const schema = {
			type: 'object',
			additionalProperties: {
				type: 'string',
				sanitize_callback: 'sanitize_text_field',
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			additionalProperties: {
				type: 'string',
			},
		} );
	} );

	it( 'should preserve all valid JSON Schema keywords', () => {
		const schema = {
			type: 'object',
			description: 'Test schema',
			required: [ 'name' ],
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[a-z]+$',
					default: 'test',
					enum: [ 'test', 'example' ],
				},
				count: {
					type: 'number',
					minimum: 0,
					maximum: 100,
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( schema );
	} );

	it( 'should handle empty schema', () => {
		expect( sanitizeSchema( {} ) ).toEqual( {} );
	} );

	it( 'should sanitize items as tuple array', () => {
		const schema = {
			type: 'array',
			items: [
				{
					type: 'string',
					sanitize_callback: 'sanitize_text_field',
				},
				{ type: 'number' },
			],
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'array',
			items: [ { type: 'string' }, { type: 'number' } ],
		} );
	} );

	it( 'should sanitize additionalItems schema', () => {
		const schema = {
			type: 'array',
			items: [ { type: 'string' } ],
			additionalItems: {
				type: 'number',
				sanitize_callback: 'absint',
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'array',
			items: [ { type: 'string' } ],
			additionalItems: { type: 'number' },
		} );
	} );

	it( 'should pass through additionalItems when boolean', () => {
		const schema = {
			type: 'array',
			items: [ { type: 'string' } ],
			additionalItems: false,
		};

		expect( sanitizeSchema( schema ) ).toEqual( schema );
	} );

	it( 'should sanitize definitions', () => {
		const schema = {
			type: 'object',
			definitions: {
				name: {
					type: 'string',
					sanitize_callback: 'sanitize_text_field',
				},
			},
			properties: {
				user: { $ref: '#/definitions/name' },
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			definitions: {
				name: { type: 'string' },
			},
			properties: {
				user: { $ref: '#/definitions/name' },
			},
		} );
	} );

	it( 'should handle deeply nested schemas', () => {
		const schema = {
			type: 'object',
			properties: {
				items: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							value: {
								type: 'string',
								sanitize_callback: 'sanitize_text_field',
							},
						},
					},
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			properties: {
				items: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							value: {
								type: 'string',
							},
						},
					},
				},
			},
		} );
	} );

	it( 'should recursively sanitize allOf schemas', () => {
		const schema = {
			allOf: [
				{
					type: 'object',
					sanitize_callback: 'sanitize_text_field',
				},
				{
					properties: {
						name: {
							type: 'string',
							validate_callback: 'is_string',
						},
					},
				},
			],
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			allOf: [
				{ type: 'object' },
				{
					properties: {
						name: { type: 'string' },
					},
				},
			],
		} );
	} );

	it( 'should recursively sanitize not schema', () => {
		const schema = {
			not: {
				type: 'string',
				sanitize_callback: 'sanitize_text_field',
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			not: { type: 'string' },
		} );
	} );

	it( 'should recursively sanitize patternProperties', () => {
		const schema = {
			type: 'object',
			patternProperties: {
				'^S_': {
					type: 'string',
					sanitize_callback: 'sanitize_text_field',
				},
				'^I_': {
					type: 'integer',
					validate_callback: 'is_numeric',
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			patternProperties: {
				'^S_': { type: 'string' },
				'^I_': { type: 'integer' },
			},
		} );
	} );

	it( 'should pass through additionalProperties when boolean', () => {
		const schema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
			},
			additionalProperties: false,
		};

		expect( sanitizeSchema( schema ) ).toEqual( schema );
	} );

	it( 'should sanitize schema dependencies and pass through property dependencies', () => {
		const schema = {
			type: 'object',
			dependencies: {
				bar: [ 'foo' ],
				baz: {
					type: 'object',
					sanitize_callback: 'sanitize_text_field',
					properties: {
						qux: {
							type: 'string',
							validate_callback: 'is_string',
						},
					},
				},
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			dependencies: {
				bar: [ 'foo' ],
				baz: {
					type: 'object',
					properties: {
						qux: { type: 'string' },
					},
				},
			},
		} );
	} );

	it( 'should sanitize $defs', () => {
		const schema = {
			type: 'object',
			$defs: {
				address: {
					type: 'object',
					sanitize_callback: 'sanitize_address',
					properties: {
						street: {
							type: 'string',
							sanitize_callback: 'sanitize_text_field',
						},
					},
				},
			},
			properties: {
				home: { $ref: '#/$defs/address' },
			},
		};

		expect( sanitizeSchema( schema ) ).toEqual( {
			type: 'object',
			$defs: {
				address: {
					type: 'object',
					properties: {
						street: { type: 'string' },
					},
				},
			},
			properties: {
				home: { $ref: '#/$defs/address' },
			},
		} );
	} );
} );
