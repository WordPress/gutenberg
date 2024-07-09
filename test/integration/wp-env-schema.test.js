/**
 * External dependencies
 */
import Ajv from 'ajv';
import glob from 'fast-glob';

/**
 * Internal dependencies
 */
import wpEnvSchema from '../../schemas/json/wp-env.json';

describe( '.wp-env.json schema', () => {
	const jsonFiles = glob.sync( [ '.wp-env.json' ], { onlyFiles: true } );
	const ajv = new Ajv( {
		allowMatchingProperties: true,
	} );

	test( 'strictly adheres to the draft-07 meta schema', () => {
		// Use ajv.compile instead of ajv.validateSchema to validate the schema
		// because validateSchema only checks syntax, whereas, compile checks
		// if the schema is semantically correct with strict mode.
		// See https://github.com/ajv-validator/ajv/issues/1434#issuecomment-822982571
		const result = ajv.compile( wpEnvSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'found .wp-env.json files', () => {
		expect( jsonFiles.length ).toBeGreaterThan( 0 );
	} );

	test.each( jsonFiles )( 'validates schema for `%s`', ( filepath ) => {
		// We want to validate the .wp-env.json file using the local schema.
		const { $schema, ...metadata } = require( filepath );

		// we expect the $schema property to be present in the .wp-env.json file
		expect( $schema ).toBeTruthy();

		const result = ajv.validate( wpEnvSchema, metadata ) || ajv.errors;

		expect( result ).toBe( true );
	} );
} );
