/**
 * Internal dependencies
 */
import { getUniqueTemplatePartTitle, getCleanTemplatePartSlug } from '../utils';

describe( 'getUniqueTemplatePartTitle', () => {
	it( 'should return the title if it is unique', () => {
		const title = 'My Template Part';
		const templateParts = [
			{
				title: {
					rendered: 'Template Part With Another Title',
				},
			},
		];

		expect( getUniqueTemplatePartTitle( title, templateParts ) ).toBe(
			title
		);
	} );

	it( 'should return the title with a suffix if it is not unique', () => {
		const title = 'My Template Part';
		const templateParts = [
			{
				title: {
					rendered: 'My Template Part',
				},
			},
			{
				title: {
					rendered: 'My Template Part 2',
				},
			},
		];

		expect( getUniqueTemplatePartTitle( title, templateParts ) ).toBe(
			'My Template Part 3'
		);
	} );
} );

describe( 'getCleanTemplatePartSlug', () => {
	it( 'should return a slug with only latin chars', () => {
		const title = 'Myɶ Template Partɮ';
		expect( getCleanTemplatePartSlug( title ) ).toBe( 'my-template-part' );
	} );

	it( 'should return a slug with only latin chars and numbers', () => {
		const title = 'My Template Part 2';
		expect( getCleanTemplatePartSlug( title ) ).toBe(
			'my-template-part-2'
		);
	} );

	it( 'should default the slug to wp-custom-part', () => {
		const title = '';
		expect( getCleanTemplatePartSlug( title ) ).toBe( 'wp-custom-part' );
	} );
} );
