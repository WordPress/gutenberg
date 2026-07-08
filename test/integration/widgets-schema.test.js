/**
 * External dependencies
 */
import Ajv from 'ajv';
import glob from 'fast-glob';

/**
 * Internal dependencies
 */
import widgetSchema from '../../schemas/json/widget.json';

describe( 'widget.json schema', () => {
	const jsonFiles = glob.sync( 'widgets/**/widget.json', {
		onlyFiles: true,
	} );
	const ajv = new Ajv();

	test( 'strictly adheres to the draft-07 meta schema', () => {
		const result = ajv.compile( widgetSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'found widget.json files', () => {
		expect( jsonFiles.length ).toBeGreaterThan( 0 );
	} );

	test.each( jsonFiles )( 'validates schema for `%s`', ( filepath ) => {
		const { $schema, ...widgetMetadata } = require( filepath );

		expect( $schema ).toBe( 'https://schemas.wp.org/trunk/widget.json' );

		const result =
			ajv.validate( widgetSchema, widgetMetadata ) || ajv.errors;

		expect( result ).toBe( true );
	} );
} );
