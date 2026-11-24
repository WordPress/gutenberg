import { describe, expect, it } from 'vitest';
import { isClientSideSupportedFormat } from '../utils';

describe( 'isClientSideSupportedFormat', () => {
	it.each( [
		[ 'photo.jpg', 'image/jpeg' ],
		[ 'image.png', 'image/png' ],
		[ 'anim.gif', 'image/gif' ],
		[ 'image.webp', 'image/webp' ],
		[ 'image.avif', 'image/avif' ],
		[ 'photo.heic', 'image/heic' ],
		[ 'photo.heif', 'image/heif' ],
		[ 'PHOTO.JPG', 'IMAGE/JPEG' ],
	] )( 'accepts %s (%s)', ( name, type ) => {
		expect( isClientSideSupportedFormat( { name, type } ) ).toBe( true );
	} );

	it.each( [
		[ 'photo.heic', '' ],
		[ 'photo.HEIF', '' ],
		[ 'photo.heic', 'application/octet-stream' ],
	] )( 'accepts HEIC by extension: %s (%s)', ( name, type ) => {
		expect( isClientSideSupportedFormat( { name, type } ) ).toBe( true );
	} );

	it.each( [
		[ 'logo.svg', 'image/svg+xml' ],
		[ 'anim.json', 'application/json' ],
		[ 'doc.pdf', 'application/pdf' ],
		[ 'song.mp3', 'audio/mpeg' ],
		[ 'clip.mp4', 'video/mp4' ],
		[ 'photo.bmp', 'image/bmp' ],
		[ 'photo.jpg', '' ],
		[ '', '' ],
	] )( 'rejects %s (%s)', ( name, type ) => {
		expect( isClientSideSupportedFormat( { name, type } ) ).toBe( false );
	} );

	it( 'accepts a native File', () => {
		const file = new File( [ '' ], 'photo.webp', { type: 'image/webp' } );
		expect( isClientSideSupportedFormat( file ) ).toBe( true );
	} );
} );
