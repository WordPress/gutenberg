/**
 * External dependencies
 */
import Ajv from 'ajv-draft-04';

/**
 * Internal dependencies
 */
import themeSchema from '../../schemas/json/theme.json';

describe( 'theme.json schema', () => {
	const ajv = new Ajv();

	test( 'schema valid', () => {
		const result = ajv.validate( themeSchema, {} ) || ajv.errors;

		expect( result ).toBe( true );
	} );
} );
