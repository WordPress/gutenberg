/**
 * Tests for schema validation utilities.
 */

/**
 * Internal dependencies
 */
import { validateValueFromSchema } from '../validation';

describe( 'validateValueFromSchema', () => {
	describe( 'type validation', () => {
		it( 'should validate string type', () => {
			const schema = { type: 'string' };
			expect( validateValueFromSchema( 'hello', schema ) ).toBe( true );
			expect( validateValueFromSchema( 123, schema ) ).toBe(
				' is not of type string.'
			);
		} );

		it( 'should validate number type', () => {
			const schema = { type: 'number' };
			expect( validateValueFromSchema( 123, schema ) ).toBe( true );
			expect( validateValueFromSchema( 45.67, schema ) ).toBe( true );
			expect( validateValueFromSchema( 'hello', schema ) ).toBe(
				' is not of type number.'
			);
		} );

		it( 'should validate boolean type', () => {
			const schema = { type: 'boolean' };
			expect( validateValueFromSchema( true, schema ) ).toBe( true );
			expect( validateValueFromSchema( false, schema ) ).toBe( true );
			expect( validateValueFromSchema( 'true', schema ) ).toBe(
				' is not of type boolean.'
			);
		} );

		it( 'should validate array type', () => {
			const schema = { type: 'array' };
			expect( validateValueFromSchema( [ 1, 2, 3 ], schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( {}, schema ) ).toBe(
				' is not of type array.'
			);
		} );

		it( 'should validate object type', () => {
			const schema = { type: 'object' };
			expect( validateValueFromSchema( { a: 1 }, schema ) ).toBe( true );
			expect( validateValueFromSchema( [], schema ) ).toBe(
				' is not of type object.'
			);
		} );
	} );

	describe( 'object validation', () => {
		it( 'should validate required properties', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
					age: { type: 'number' },
				},
				required: [ 'name' ],
			};

			expect(
				validateValueFromSchema( { name: 'John', age: 30 }, schema )
			).toBe( true );
			expect( validateValueFromSchema( { name: 'John' }, schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( { age: 30 }, schema ) ).toBe(
				'name is a required property of .'
			);
		} );

		it( 'should validate nested objects', () => {
			const schema = {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							name: { type: 'string' },
						},
						required: [ 'name' ],
					},
				},
			};

			expect(
				validateValueFromSchema( { user: { name: 'John' } }, schema )
			).toBe( true );
			expect( validateValueFromSchema( { user: {} }, schema ) ).toBe(
				'name is a required property of [user].'
			);
		} );

		it( 'should validate additionalProperties: false', () => {
			const schema = {
				type: 'object',
				properties: {
					name: { type: 'string' },
				},
				additionalProperties: false,
			};

			expect( validateValueFromSchema( { name: 'John' }, schema ) ).toBe(
				true
			);
			expect(
				validateValueFromSchema(
					{ name: 'John', extra: 'value' },
					schema
				)
			).toBe( 'extra is not a valid property of Object.' );
		} );
	} );

	describe( 'array validation', () => {
		it( 'should validate array items', () => {
			const schema = {
				type: 'array',
				items: { type: 'number' },
			};

			expect( validateValueFromSchema( [ 1, 2, 3 ], schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( [ 1, 'two', 3 ], schema ) ).toBe(
				'[1] is not of type number.'
			);
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should pass validation when empty schema provided', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();

			expect( validateValueFromSchema( 'anything', {} ) ).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'The "type" schema keyword for value is required.'
			);

			consoleSpy.mockRestore();
		} );

		it( 'should warn when type is missing but still pass validation', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();
			const schema = { properties: { name: { type: 'string' } } };
			const result = validateValueFromSchema( { name: 'test' }, schema );

			expect( result ).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'The "type" schema keyword for value is required.'
			);

			consoleSpy.mockRestore();
		} );

		it( 'should include param name in warning when provided', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();
			const schema = { format: 'email' }; // Schema without type
			const result = validateValueFromSchema(
				'test@example.com',
				schema,
				'email_field'
			);

			expect( result ).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'The "type" schema keyword for email_field is required.'
			);

			consoleSpy.mockRestore();
		} );

		it( 'should handle null values correctly', () => {
			const schema = { type: [ 'string', 'null' ] };
			expect( validateValueFromSchema( null, schema ) ).toBe( true );
			expect( validateValueFromSchema( 'hello', schema ) ).toBe( true );
		} );
	} );

	describe( 'AI-relevant format validation', () => {
		it( 'should validate email format', () => {
			const schema = { type: 'string', format: 'email' };
			expect(
				validateValueFromSchema( 'user@example.com', schema )
			).toBe( true );
			expect( validateValueFromSchema( 'invalid-email', schema ) ).toBe(
				'Invalid email address.'
			);
		} );

		it( 'should validate date-time format', () => {
			const schema = { type: 'string', format: 'date-time' };
			expect(
				validateValueFromSchema( '2024-01-15T10:30:00Z', schema )
			).toBe( true );
			expect(
				validateValueFromSchema( '2024-01-15T10:30:00.123Z', schema )
			).toBe( true );
			expect( validateValueFromSchema( 'not-a-date', schema ) ).toBe(
				'Invalid date.'
			);
		} );

		it( 'should validate UUID format', () => {
			const schema = { type: 'string', format: 'uuid' };
			expect(
				validateValueFromSchema(
					'123e4567-e89b-12d3-a456-426614174000',
					schema
				)
			).toBe( true );
			expect( validateValueFromSchema( 'not-a-uuid', schema ) ).toBe(
				' is not a valid UUID.'
			);
		} );

		it( 'should validate IPv4 format', () => {
			const schema = { type: 'string', format: 'ipv4' };
			expect( validateValueFromSchema( '192.168.1.1', schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( '256.256.256.256', schema ) ).toBe(
				' is not a valid IP address.'
			);
		} );

		it( 'should validate hostname format', () => {
			const schema = { type: 'string', format: 'hostname' };
			expect( validateValueFromSchema( 'example.com', schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( 'sub.example.com', schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( 'not a hostname!', schema ) ).toBe(
				' is not a valid hostname.'
			);
		} );
	} );

	describe( 'pattern validation', () => {
		it( 'should validate string patterns', () => {
			const schema = { type: 'string', pattern: '^[A-Z][a-z]+$' };
			expect( validateValueFromSchema( 'Hello', schema ) ).toBe( true );
			expect( validateValueFromSchema( 'hello', schema ) ).toBe(
				' does not match pattern ^[A-Z][a-z]+$.'
			);
		} );
	} );

	describe( 'number constraints', () => {
		it( 'should validate minimum and maximum', () => {
			const schema = { type: 'number', minimum: 0, maximum: 100 };
			expect( validateValueFromSchema( 50, schema ) ).toBe( true );
			expect( validateValueFromSchema( 0, schema ) ).toBe( true );
			expect( validateValueFromSchema( 100, schema ) ).toBe( true );
			expect( validateValueFromSchema( -1, schema ) ).toBe(
				' must be greater than or equal to 0'
			);
			expect( validateValueFromSchema( 101, schema ) ).toBe(
				' must be less than or equal to 100'
			);
		} );

		it( 'should validate multipleOf', () => {
			const schema = { type: 'number', multipleOf: 5 };
			expect( validateValueFromSchema( 10, schema ) ).toBe( true );
			expect( validateValueFromSchema( 15, schema ) ).toBe( true );
			expect( validateValueFromSchema( 7, schema ) ).toBe(
				' must be a multiple of 5.'
			);
		} );
	} );

	describe( 'enum validation', () => {
		it( 'should validate enum values', () => {
			const schema = {
				type: 'string',
				enum: [ 'read', 'write', 'execute' ],
			};
			expect( validateValueFromSchema( 'read', schema ) ).toBe( true );
			expect( validateValueFromSchema( 'delete', schema ) ).toBe(
				' is not one of read, write, execute.'
			);
		} );
	} );

	describe( 'anyOf validation', () => {
		it( 'should validate anyOf schemas', () => {
			const schema = {
				anyOf: [ { type: 'string' }, { type: 'number' } ],
			};
			expect( validateValueFromSchema( 'hello', schema ) ).toBe( true );
			expect( validateValueFromSchema( 42, schema ) ).toBe( true );
			expect( validateValueFromSchema( true, schema ) ).toBe(
				' is invalid (failed anyOf validation).'
			);
		} );
	} );

	describe( 'strict JSON validation (no type coercion)', () => {
		it( 'should NOT coerce string "true" to boolean', () => {
			const schema = { type: 'boolean' };
			expect( validateValueFromSchema( true, schema ) ).toBe( true );
			expect( validateValueFromSchema( false, schema ) ).toBe( true );
			expect( validateValueFromSchema( 'true', schema ) ).toBe(
				' is not of type boolean.'
			);
			expect( validateValueFromSchema( '1', schema ) ).toBe(
				' is not of type boolean.'
			);
		} );

		it( 'should NOT accept empty string as object', () => {
			const schema = { type: 'object' };
			expect( validateValueFromSchema( {}, schema ) ).toBe( true );
			expect( validateValueFromSchema( '', schema ) ).toBe(
				' is not of type object.'
			);
		} );
	} );

	describe( 'string length constraints', () => {
		it( 'should validate minLength constraint', () => {
			const schema = { type: 'string', minLength: 3 };
			expect( validateValueFromSchema( 'hello', schema ) ).toBe( true );
			expect( validateValueFromSchema( 'hi', schema ) ).toBe(
				' must be at least 3 characters long.'
			);
		} );

		it( 'should validate maxLength constraint', () => {
			const schema = { type: 'string', maxLength: 5 };
			expect( validateValueFromSchema( 'hello', schema ) ).toBe( true );
			expect( validateValueFromSchema( 'hello world', schema ) ).toBe(
				' must be at most 5 characters long.'
			);
		} );

		it( 'should handle singular character in length messages', () => {
			const minSchema = { type: 'string', minLength: 1 };
			expect( validateValueFromSchema( '', minSchema ) ).toBe(
				' must be at least 1 character long.'
			);

			const maxSchema = { type: 'string', maxLength: 1 };
			expect( validateValueFromSchema( 'ab', maxSchema ) ).toBe(
				' must be at most 1 character long.'
			);
		} );
	} );

	describe( 'array item constraints', () => {
		it( 'should validate minItems constraint', () => {
			const schema = { type: 'array', minItems: 2 };
			expect( validateValueFromSchema( [ 1, 2, 3 ], schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( [ 1 ], schema ) ).toBe(
				' must contain at least 2 items.'
			);
		} );

		it( 'should validate maxItems constraint', () => {
			const schema = { type: 'array', maxItems: 3 };
			expect( validateValueFromSchema( [ 1, 2, 3 ], schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( [ 1, 2, 3, 4 ], schema ) ).toBe(
				' must contain at most 3 items.'
			);
		} );

		it( 'should validate uniqueItems constraint', () => {
			const schema = { type: 'array', uniqueItems: true };
			expect( validateValueFromSchema( [ 1, 2, 3 ], schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( [ 1, 2, 2, 3 ], schema ) ).toBe(
				' has duplicate items.'
			);
		} );

		it( 'should handle singular item in item messages', () => {
			const minSchema = { type: 'array', minItems: 1 };
			expect( validateValueFromSchema( [], minSchema ) ).toBe(
				' must contain at least 1 item.'
			);

			const maxSchema = { type: 'array', maxItems: 1 };
			expect( validateValueFromSchema( [ 1, 2 ], maxSchema ) ).toBe(
				' must contain at most 1 item.'
			);
		} );
	} );

	describe( 'object property constraints', () => {
		it( 'should validate minProperties constraint', () => {
			const schema = { type: 'object', minProperties: 2 };
			expect( validateValueFromSchema( { a: 1, b: 2 }, schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( { a: 1 }, schema ) ).toBe(
				' must contain at least 2 properties.'
			);
		} );

		it( 'should validate maxProperties constraint', () => {
			const schema = { type: 'object', maxProperties: 2 };
			expect( validateValueFromSchema( { a: 1, b: 2 }, schema ) ).toBe(
				true
			);
			expect(
				validateValueFromSchema( { a: 1, b: 2, c: 3 }, schema )
			).toBe( ' must contain at most 2 properties.' );
		} );

		it( 'should handle singular property in property messages', () => {
			const minSchema = { type: 'object', minProperties: 1 };
			expect( validateValueFromSchema( {}, minSchema ) ).toBe(
				' must contain at least 1 property.'
			);

			const maxSchema = { type: 'object', maxProperties: 1 };
			expect( validateValueFromSchema( { a: 1, b: 2 }, maxSchema ) ).toBe(
				' must contain at most 1 property.'
			);
		} );
	} );

	describe( 'schema edge cases and errors', () => {
		it( 'should handle empty schema object as valid but warn about missing type', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();

			// Empty object schema triggers warning about missing type
			expect( validateValueFromSchema( 'anything', {} ) ).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'The "type" schema keyword for value is required.'
			);

			consoleSpy.mockRestore();
		} );

		it( 'should warn for invalid schema types but still pass validation', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();

			// Testing edge cases where schema is not a valid object
			expect(
				validateValueFromSchema(
					'anything',
					undefined as unknown as Record< string, any >
				)
			).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'Schema must be an object. Received undefined.'
			);

			consoleSpy.mockClear();
			expect(
				validateValueFromSchema(
					123,
					null as unknown as Record< string, any >
				)
			).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'Schema must be an object. Received object.' // typeof null === 'object'
			);

			consoleSpy.mockClear();
			expect(
				validateValueFromSchema(
					true,
					false as unknown as Record< string, any >
				)
			).toBe( true );
			expect( consoleSpy ).toHaveBeenCalledWith(
				'Schema must be an object. Received boolean.'
			);

			consoleSpy.mockRestore();
		} );

		it( 'should handle schema compilation errors', () => {
			// Pass an invalid schema that will cause compilation error
			const invalidSchema = { type: 'invalid-type' };
			const consoleErrorSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation();

			const result = validateValueFromSchema( 'test', invalidSchema );

			expect( result ).toBe( 'Invalid schema provided for validation.' );
			expect( consoleErrorSpy ).toHaveBeenCalledWith(
				'Schema compilation error:',
				expect.any( Error )
			);

			consoleErrorSpy.mockRestore();
		} );

		it( 'should handle const validation keyword', () => {
			const schema = {
				type: 'string',
				const: 'exact-value',
			};

			expect( validateValueFromSchema( 'exact-value', schema ) ).toBe(
				true
			);
			expect( validateValueFromSchema( 'different-value', schema ) ).toBe(
				'must be equal to constant'
			);
		} );
	} );
} );
