/**
 * External dependencies
 */
import Ajv from 'ajv';

/**
 * Internal dependencies
 */
import themeSchema from '../../schemas/json/theme.json';

const baseThemeJson = {
	version: 2,
};

describe( 'theme.json schema', () => {
	const ajv = new Ajv( {
		// Used for matching unknown blocks without repeating core blocks names
		// in settings.blocks and settings.styles
		allowMatchingProperties: true,
	} );

	test( 'schema valid', () => {
		const result = ajv.validate( themeSchema, baseThemeJson ) || ajv.errors;

		expect( result ).toBe( true );
	} );
} );
