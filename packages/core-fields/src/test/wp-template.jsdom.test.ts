import { describe, expect, it } from 'vitest';
import wpTemplate from '../wp_template';

describe( 'wp_template', () => {
	it( 'provides the JavaScript parts of the template author field', () => {
		expect( Object.keys( wpTemplate ) ).toEqual( [ 'author' ] );
		expect( wpTemplate.author ).toEqual( {
			getValue: expect.any( Function ),
			render: expect.any( Function ),
			getElements: expect.any( Function ),
		} );
	} );

	it( 'reads the author text of the template', () => {
		expect(
			wpTemplate.author.getValue?.( {
				item: { author: 1, author_text: 'Twenty Twenty-Five' },
			} )
		).toBe( 'Twenty Twenty-Five' );
	} );
} );
