/**
 * Internal dependencies
 */
import { sanitizeSchema } from '../index';

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

	it( 'should return non-object values as-is', () => {
		expect( sanitizeSchema( null as any ) ).toBeNull();
		expect( sanitizeSchema( undefined as any ) ).toBeUndefined();
		expect( sanitizeSchema( [] as any ) ).toEqual( [] );
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
} );
