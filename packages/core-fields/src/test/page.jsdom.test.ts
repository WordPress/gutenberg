import { describe, expect, it } from 'vitest';
import page from '../page';

describe( 'page', () => {
	it( 'provides the JavaScript parts of the page title field', () => {
		expect( Object.keys( page ) ).toEqual( [ 'title' ] );
		expect(
			page.title.getValue?.( { item: { title: { raw: 'About' } } } )
		).toBe( 'About' );
	} );
} );
