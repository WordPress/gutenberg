/**
 * External dependencies
 */
import Ajv from 'ajv-draft-04';

/**
 * Internal dependencies
 */
import themeSchema from '../../schemas/json/theme.json';

describe( 'theme.json schema', () => {
	const ajv = new Ajv( {
		// Used for matching unknown blocks without repeating core blocks names
		// with patternProperties in settings.blocks and settings.styles
		allowMatchingProperties: true,
	} );

	it( 'compiles in strict mode', async () => {
		const result = ajv.compile( themeSchema );

		expect( result.errors ).toBe( null );
	} );
} );
