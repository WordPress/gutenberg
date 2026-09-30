import { describe, expect, it } from 'vitest';
import wpTemplate from '../wp_template';

describe( 'wp_template', () => {
	it( 'provides the JavaScript parts of the fields that have some', () => {
		expect( Object.keys( wpTemplate ) ).toEqual( [
			'author',
			'description',
			'description_readonly',
			'posts_page_title',
			'posts_per_page',
			'default_comment_status',
			'title',
		] );
	} );

	it( 'provides the JavaScript parts of the template author field', () => {
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

	it( 'edits the description of custom templates only', () => {
		const { getValue, isVisible } = wpTemplate.description;
		expect(
			getValue?.( { item: { description: 'Tom &amp; Jerry' } } )
		).toBe( 'Tom & Jerry' );
		expect(
			isVisible?.( {
				source: 'custom',
				has_theme_file: false,
				is_custom: true,
			} )
		).toBe( true );
		expect( isVisible?.( { source: 'theme', has_theme_file: true } ) ).toBe(
			false
		);
	} );

	it( 'shows the description of the other templates read-only', () => {
		const { isVisible } = wpTemplate.description_readonly;
		expect(
			isVisible?.( { source: 'theme', description: 'Shows posts.' } )
		).toBe( true );
		expect( isVisible?.( { source: 'theme' } ) ).toBe( false );
		expect(
			isVisible?.( {
				source: 'custom',
				has_theme_file: false,
				is_custom: true,
				description: 'Mine.',
			} )
		).toBe( false );
	} );
} );
