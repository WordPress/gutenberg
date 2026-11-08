import { describe, expect, it } from 'vitest';
import wpTemplatePart from '../wp_template_part';

describe( 'wp_template_part', () => {
	it( 'maps the id of each template part action to its JavaScript parts', () => {
		expect( Object.keys( wpTemplatePart ) ).toEqual( [
			'duplicate-template-part',
		] );
		for ( const parts of Object.values( wpTemplatePart ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'callback' in parts || 'RenderModal' in parts ).toBe(
				true
			);
		}
	} );
} );
