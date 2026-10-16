import { describe, expect, it } from 'vitest';
import wpTemplatePart from '../wp_template_part';

describe( 'wp_template_part', () => {
	it( 'maps the id of each template part action to the action', () => {
		expect( Object.keys( wpTemplatePart ) ).toEqual( [
			'duplicate-template-part',
		] );
		for ( const [ id, action ] of Object.entries( wpTemplatePart ) ) {
			expect( action.id ).toBe( id );
		}
	} );
} );
