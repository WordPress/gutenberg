/**
 * Internal dependencies
 */
import getTemplateInfo from '../';
import {
	TEMPLATES_DEFAULT_DETAILS,
	TEMPLATES_DEFAULT_ORDER,
} from '../constants';

describe( 'get template info', () => {
	it( 'should return an empty object if no template is passed', () => {
		expect( getTemplateInfo( null ) ).toEqual( {} );
		expect( getTemplateInfo( undefined ) ).toEqual( {} );
		expect( getTemplateInfo( false ) ).toEqual( {} );
	} );

	it( 'should return the default title if none is defined on the template', () => {
		expect( getTemplateInfo( { slug: 'index' } ).title ).toEqual( 'Index' );
	} );

	it( 'should return the rendered title if one is defined on the template', () => {
		expect(
			getTemplateInfo( {
				slug: 'index',
				title: { rendered: 'test title' },
			} ).title
		).toEqual( 'test title' );
	} );

	it( 'should return the slug if no title is found', () => {
		expect(
			getTemplateInfo( {
				slug: 'not a real template',
			} ).title
		).toEqual( 'not a real template' );
	} );

	it( 'should return the default description if none is defined on the template', () => {
		expect(
			getTemplateInfo( {
				slug: 'index',
			} ).description
		).toEqual( 'Default template' );
	} );

	it( 'should return the rendered excerpt as description if defined on the template', () => {
		expect(
			getTemplateInfo( {
				slug: 'index',
				excerpt: {
					rendered: 'test description',
				},
			} ).description
		).toEqual( 'test description' );
	} );

	it( 'should return both a title and a description', () => {
		expect(
			getTemplateInfo( {
				slug: 'index',
				excerpt: {
					rendered: 'test description',
				},
			} )
		).toMatchSnapshot();

		expect(
			getTemplateInfo( {
				slug: 'index',
			} )
		).toMatchSnapshot();

		expect( getTemplateInfo( {} ) ).toMatchSnapshot();
	} );

	it( 'should have the same templates in TEMPLATES_DEFAULT_DETAILS and TEMPLATES_DEFAULT_ORDER', () => {
		expect( Object.keys( TEMPLATES_DEFAULT_DETAILS ).sort() ).toEqual(
			TEMPLATES_DEFAULT_ORDER.sort()
		);
	} );
} );
