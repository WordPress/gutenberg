/**
 * External dependencies
 */
import Ajv from 'ajv';
import glob from 'fast-glob';

/**
 * Internal dependencies
 */
import themeSchema from '../../schemas/json/theme.json';

describe( 'theme.json schema', () => {
	const jsonFiles = glob.sync(
		[ 'packages/*/src/**/theme.json', '{lib,phpunit,test}/**/theme.json' ],
		{ onlyFiles: true }
	);
	const invalidFiles = glob.sync(
		[ 'test/integration/fixtures/schemas/*.json' ],
		{ onlyFiles: true }
	);
	const ajv = new Ajv( {
		// Used for matching unknown blocks without repeating core blocks names
		// with patternProperties in settings.blocks and settings.styles
		allowMatchingProperties: true,
	} );

	it( 'strictly adheres to the draft-07 meta schema', () => {
		// Use ajv.compile instead of ajv.validateSchema to validate the schema
		// because validateSchema only checks syntax, whereas, compile checks
		// if the schema is semantically correct with strict mode.
		// See https://github.com/ajv-validator/ajv/issues/1434#issuecomment-822982571
		const result = ajv.compile( themeSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'found theme.json files', () => {
		expect( jsonFiles.length ).toBeGreaterThan( 0 );
	} );

	test.each( jsonFiles )( 'validates schema for `%s`', ( filepath ) => {
		// We want to validate the theme.json file using the local schema.
		const { $schema, ...metadata } = require( filepath );

		// we expect the $schema property to be present in the theme.json file
		expect( $schema ).toBeTruthy();

		const result = ajv.validate( themeSchema, metadata ) || ajv.errors;

		expect( result ).toBe( true );
	} );

	test.each( invalidFiles )( 'invalidates schema for `%s`', ( filepath ) => {
		// We want to validate the theme.json file using the local schema.
		const { $schema, ...metadata } = require( filepath );

		const result = ajv.validate( themeSchema, metadata );

		expect( result ).toBe( false );
	} );
} );
