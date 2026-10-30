import { describe, expect, it } from 'vitest';
import wpBlock from '../wp_block';

describe( 'wp_block', () => {
	it( 'maps the id of each pattern action to its JavaScript parts', () => {
		expect( Object.keys( wpBlock ) ).toEqual( [
			'duplicate-pattern',
			'export-pattern',
		] );
		for ( const parts of Object.values( wpBlock ) ) {
			// The data of the action, such as its id and label, is
			// registered on the server.
			expect( parts ).not.toHaveProperty( 'id' );
			expect( 'callback' in parts || 'RenderModal' in parts ).toBe(
				true
			);
		}
	} );
} );
