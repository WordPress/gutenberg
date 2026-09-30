import { describe, expect, it } from 'vitest';
import attachment from '../attachment';

describe( 'attachment', () => {
	it( 'provides the JavaScript parts of the fields that have some', () => {
		expect( Object.keys( attachment ) ).toEqual( [
			'alt_text',
			'caption',
			'description',
			'filename',
			'filesize',
			'media_dimensions',
			'mime_type',
		] );
	} );

	it( 'reads the file type', () => {
		const { getValue, render } = attachment.mime_type;
		expect( getValue?.( { item: { mime_type: 'image/png' } } ) ).toBe(
			'image/png'
		);
		expect( getValue?.( { item: {} } ) ).toBe( '' );
		expect(
			( render as ( props: { item: object } ) => string )( { item: {} } )
		).toBe( '-' );
	} );

	it( 'reads the raw caption', () => {
		const { getValue } = attachment.caption;
		expect( getValue?.( { item: { caption: 'Plain' } } ) ).toBe( 'Plain' );
		expect(
			getValue?.( {
				item: { caption: { raw: 'Raw', rendered: '<p>Raw</p>' } },
			} )
		).toBe( 'Raw' );
		expect( getValue?.( { item: {} } ) ).toBe( '' );
	} );

	it( 'reads the raw description', () => {
		expect(
			attachment.description.getValue?.( {
				item: { description: { raw: 'Raw', rendered: '<p>Raw</p>' } },
			} )
		).toBe( 'Raw' );
	} );

	it( 'shows the alternative text of images only', () => {
		const { isVisible } = attachment.alt_text;
		expect( isVisible?.( { media_type: 'image' } ) ).toBe( true );
		expect( isVisible?.( { media_type: 'file' } ) ).toBe( false );
	} );

	it( 'shows the dimensions of the media that have some', () => {
		const { getValue, isVisible } = attachment.media_dimensions;
		const item = { media_details: { width: 640, height: 480 } };
		expect( getValue?.( { item } ) ).toBe( '640 × 480' );
		expect( isVisible?.( item ) ).toBe( true );
		expect( getValue?.( { item: {} } ) ).toBe( '' );
		expect( isVisible?.( { media_details: { width: 640 } } ) ).toBe(
			false
		);
	} );

	it.each( [
		[ 512, '512 B' ],
		[ 1024 * 50, '50 KB' ],
		[ 1024 * 1024 * 2.5, '2.5 MB' ],
	] )( 'formats a file size of %i bytes', ( filesize, expected ) => {
		expect(
			attachment.filesize.getValue?.( {
				item: { media_details: { filesize } },
			} )
		).toBe( expected );
	} );

	it( 'hides the file size of the media without one', () => {
		const { getValue, isVisible } = attachment.filesize;
		expect(
			getValue?.( { item: { media_details: { filesize: 0 } } } )
		).toBe( '' );
		expect( isVisible?.( {} ) ).toBe( false );
	} );

	it( 'reads the file name from the source URL', () => {
		expect(
			attachment.filename.getValue?.( {
				item: { source_url: 'https://example.org/uploads/photo.jpg' },
			} )
		).toBe( 'photo.jpg' );
	} );
} );
