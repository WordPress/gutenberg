import { describe, expect, it } from 'vitest';
import wpTemplatePart from '../wp_template_part';

describe( 'wp_template_part', () => {
	it( 'provides the JavaScript parts of the fields that have some', () => {
		expect( Object.keys( wpTemplatePart ) ).toEqual( [
			'author',
			'title',
		] );
	} );

	it( 'reads the author text of the template part', () => {
		expect(
			wpTemplatePart.author.getValue?.( {
				item: { author: 1, author_text: 'Twenty Twenty-Five' },
			} )
		).toBe( 'Twenty Twenty-Five' );
	} );

	it( 'reads the title of the template part', () => {
		expect(
			wpTemplatePart.title.getValue?.( {
				item: { title: { raw: 'Header' } },
			} )
		).toBe( 'Header' );
	} );
} );
