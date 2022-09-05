/**
 * External dependencies
 */
import Ajv from 'ajv';

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

	it( 'validates', async () => {
		const result =
			ajv.validate(
				'http://json-schema.org/draft-07/schema#',
				themeSchema
			) || ajv.errors;

		expect( result ).toBe( true );
	} );
} );
