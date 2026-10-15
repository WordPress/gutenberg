import { describe, expect, it } from 'vitest';
import wpBlock from '../wp_block';

describe( 'wp_block', () => {
	it( 'maps the id of each pattern action to what performs it', () => {
		expect( Object.keys( wpBlock ) ).toEqual( [
			'duplicate-pattern',
			'export-pattern',
		] );
		// The data of each action, its id included, comes from the server.
		for ( const action of Object.values( wpBlock ) ) {
			expect( 'callback' in action || 'RenderModal' in action ).toBe(
				true
			);
			expect( action ).not.toHaveProperty( 'id' );
		}
	} );
} );
