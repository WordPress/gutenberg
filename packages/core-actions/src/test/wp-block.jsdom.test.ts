import { describe, expect, it } from 'vitest';
import wpBlock from '../wp_block';

describe( 'wp_block', () => {
	it( 'maps the id of each pattern action to the action', () => {
		expect( Object.keys( wpBlock ) ).toEqual( [
			'duplicate-pattern',
			'export-pattern',
		] );
		for ( const [ id, action ] of Object.entries( wpBlock ) ) {
			expect( action.id ).toBe( id );
		}
	} );
} );
