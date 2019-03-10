/**
 * Internal dependencies
 */
import { stripFirstImage } from '../';

describe( 'stripFirstImage', () => {
	test( 'should do nothing if no image is present', () => {
		expect( stripFirstImage( {}, { shortcode: { content: '' } } ) ).toEqual( '' );
		expect( stripFirstImage( {}, { shortcode: { content: 'Tucson' } } ) ).toEqual( 'Tucson' );
		expect( stripFirstImage( {}, { shortcode: { content: '<em>Tucson</em>' } } ) ).toEqual( '<em>Tucson</em>' );
	} );

	test( 'should strip out image when leading as expected', () => {
		expect( stripFirstImage( {}, { shortcode: { content: '<img>' } } ) ).toEqual( '' );
		expect( stripFirstImage( {}, { shortcode: { content: '<img>Image!' } } ) ).toEqual( 'Image!' );
		expect( stripFirstImage( {}, { shortcode: { content: '<img src="image.png">Image!' } } ) ).toEqual( 'Image!' );
	} );

	test( 'should strip out image when not in leading position as expected', () => {
		expect( stripFirstImage( {}, { shortcode: { content: 'Before<img>' } } ) ).toEqual( 'Before' );
		expect( stripFirstImage( {}, { shortcode: { content: 'Before<img>Image!' } } ) ).toEqual( 'BeforeImage!' );
		expect( stripFirstImage( {}, { shortcode: { content: 'Before<img src="image.png">Image!' } } ) ).toEqual( 'BeforeImage!' );
	} );

	test( 'should strip out only the first of many images', () => {
		expect( stripFirstImage( {}, { shortcode: { content: '<img><img>' } } ) ).toEqual( '<img>' );
	} );
} );
