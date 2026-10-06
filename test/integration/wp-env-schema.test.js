import Ajv from 'ajv';
import { describe, expect, test } from 'vitest';
import wpEnvSchema from '../../schemas/json/wp-env.json';
import wpEnvJsonFile from '../../.wp-env.json';

describe( '.wp-env.json schema', () => {
	const ajv = new Ajv( {
		allowMatchingProperties: true,
		allowUnionTypes: true,
	} );

	test( 'strictly adheres to the draft-07 meta schema', () => {
		// Use ajv.compile instead of ajv.validateSchema to validate the schema
		// because validateSchema only checks syntax, whereas, compile checks
		// if the schema is semantically correct with strict mode.
		// See https://github.com/ajv-validator/ajv/issues/1434#issuecomment-822982571
		const result = ajv.compile( wpEnvSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'validates schema for .wp-env.json', () => {
		// We want to validate the .wp-env.json file using the local schema.
		const { $schema, ...metadata } = wpEnvJsonFile;

		// we expect the $schema property to be present in the .wp-env.json file
		expect( $schema ).toBeTruthy();

		const result = ajv.validate( wpEnvSchema, metadata ) || ajv.errors;

		expect( result ).toBe( true );
	} );

	test.each( [ 'lts', 'latest', '10', '10.11', '10.3.39', null ] )(
		'accepts mariadbVersion %j at the root and in an environment',
		( mariadbVersion ) => {
			expect( ajv.validate( wpEnvSchema, { mariadbVersion } ) ).toBe(
				true
			);
			expect(
				ajv.validate( wpEnvSchema, {
					env: { tests: { mariadbVersion } },
				} )
			).toBe( true );
		}
	);

	test.each( [ 'LTS', 'lts-10', '11-noble', '', 10.11 ] )(
		'rejects mariadbVersion %j',
		( mariadbVersion ) => {
			expect( ajv.validate( wpEnvSchema, { mariadbVersion } ) ).toBe(
				false
			);
		}
	);
} );
