import { describe, expect, it } from 'vitest';
import wpTemplatePart from '../wp_template_part';

describe( 'wp_template_part', () => {
	it( 'maps the id of each template part action to what performs it', () => {
		expect( Object.keys( wpTemplatePart ) ).toEqual( [
			'duplicate-template-part',
		] );
		// The data of each action, its id included, comes from the server.
		for ( const action of Object.values( wpTemplatePart ) ) {
			expect( 'callback' in action || 'RenderModal' in action ).toBe(
				true
			);
			expect( action ).not.toHaveProperty( 'id' );
		}
	} );
} );
