/**
 * Internal dependencies
 */
import {
	generateUniqueFilenames,
	getExtensionFromMimeType,
} from '../media-util';

describe( 'generateUniqueFilenames', () => {
	it( 'should prefer the original filenames', () => {
		const urls = [
			'https://example.com/images/image1.jpg',
			'https://example.com/images/image2.jpg',
			'https://example.com/images/image3.jpg',
			'https://example.com/images/image4.jpg',
		];

		expect( generateUniqueFilenames( urls ) ).toEqual( [
			{
				url: 'https://example.com/images/image1.jpg',
				basename: 'image1',
				extension: 'jpg',
			},
			{
				url: 'https://example.com/images/image2.jpg',
				basename: 'image2',
				extension: 'jpg',
			},
			{
				url: 'https://example.com/images/image3.jpg',
				basename: 'image3',
				extension: 'jpg',
			},
			{
				url: 'https://example.com/images/image4.jpg',
				basename: 'image4',
				extension: 'jpg',
			},
		] );
	} );

	it( 'should handle filenames with no extensions', () => {
		const urls = [
			'https://example.com/images/image1',
			'https://example.com/images/image2',
			'https://example.com/images/image3',
			'https://example.com/images/image4',
		];

		expect( generateUniqueFilenames( urls ) ).toEqual( [
			{
				url: 'https://example.com/images/image1',
				basename: 'image1',
				extension: '',
			},
			{
				url: 'https://example.com/images/image2',
				basename: 'image2',
				extension: '',
			},
			{
				url: 'https://example.com/images/image3',
				basename: 'image3',
				extension: '',
			},
			{
				url: 'https://example.com/images/image4',
				basename: 'image4',
				extension: '',
			},
		] );
	} );

	it( 'should handle query parameters correctly', () => {
		const urls = [
			'https://example.com/images/image1.jpg?a=notafile.npg',
			'https://example.com/images/image2.jpg?a=notafile.npg',
			'https://example.com/images/image3.jpg?a=notafile.npg',
			'https://example.com/images/image4.jpg?a=notafile.npg',
		];

		expect( generateUniqueFilenames( urls ) ).toEqual( [
			{
				url: 'https://example.com/images/image1.jpg?a=notafile.npg',
				basename: 'image1',
				extension: 'jpg',
			},
			{
				url: 'https://example.com/images/image2.jpg?a=notafile.npg',
				basename: 'image2',
				extension: 'jpg',
			},
			{
				url: 'https://example.com/images/image3.jpg?a=notafile.npg',
				basename: 'image3',
				extension: 'jpg',
			},
			{
				url: 'https://example.com/images/image4.jpg?a=notafile.npg',
				basename: 'image4',
				extension: 'jpg',
			},
		] );
	} );

	it( 'should deduplicate identical filenames', () => {
		const urls = [
			'https://example.com/image1/image.jpg',
			'https://example.com/image2/image.jpg',
			'https://example.com/image3/image.jpg',
			'https://example.com/image4/image.jpg',
		];

		const results = generateUniqueFilenames( urls );
		expect( results.length ).toBe( urls.length );

		for ( const result of results ) {
			expect( result.extension ).toBe( 'jpg' );
		}

		const basenames = new Set(
			results.map( ( result ) => result.basename )
		);

		expect( basenames.size ).toBe( results.length );
	} );

	it( 'should deduplicate identical basenames', () => {
		const urls = [
			'https://example.com/images/image.jpg',
			'https://example.com/images/image.png',
			'https://example.com/images/image.webp',
			'https://example.com/images/image.avif',
		];

		const results = generateUniqueFilenames( urls );
		expect( results.length ).toBe( urls.length );

		expect( results[ 0 ].extension ).toBe( 'jpg' );
		expect( results[ 1 ].extension ).toBe( 'png' );
		expect( results[ 2 ].extension ).toBe( 'webp' );
		expect( results[ 3 ].extension ).toBe( 'avif' );

		const basenames = new Set(
			results.map( ( result ) => result.basename )
		);

		expect( basenames.size ).toBe( results.length );
	} );

	it( 'should deduplicate filenames without extensions', () => {
		const urls = [
			'https://example.com/image1/image',
			'https://example.com/image2/image',
			'https://example.com/image3/image',
			'https://example.com/image4/image',
		];

		const results = generateUniqueFilenames( urls );
		expect( results.length ).toBe( urls.length );

		for ( const result of results ) {
			expect( result.extension ).toBe( '' );
		}

		const basenames = new Set(
			results.map( ( result ) => result.basename )
		);

		expect( basenames.size ).toBe( results.length );
	} );

	it( 'should deduplicate paths with no filename', () => {
		const urls = [
			'https://example.com/image1/dir/',
			'https://example.com/image2/dir/',
			'https://example.com/image3/dir/',
			'https://example.com/image4/dir/',
		];

		const results = generateUniqueFilenames( urls );
		expect( results.length ).toBe( urls.length );

		for ( const result of results ) {
			expect( result.extension ).toBe( '' );
		}

		const basenames = new Set(
			results.map( ( result ) => result.basename )
		);

		expect( basenames.size ).toBe( results.length );
	} );
} );

describe( 'getExtensionFromMimeType', () => {
	it( 'should use the correct extension for common mime types on the web', () => {
		expect( getExtensionFromMimeType( 'image/png' ) ).toBe( 'png' );
		expect( getExtensionFromMimeType( 'image/jpeg' ) ).toBe( 'jpg' );
		expect( getExtensionFromMimeType( 'image/webp' ) ).toBe( 'webp' );
		expect( getExtensionFromMimeType( 'image/gif' ) ).toBe( 'gif' );
		expect( getExtensionFromMimeType( 'image/avif' ) ).toBe( 'avif' );
		expect( getExtensionFromMimeType( 'image/jxl' ) ).toBe( 'jxl' );
		expect( getExtensionFromMimeType( 'image/svg+xml' ) ).toBe( 'svg' );
		expect( getExtensionFromMimeType( 'video/mp4' ) ).toBe( 'mp4' );
		expect( getExtensionFromMimeType( 'video/mpeg' ) ).toBe( 'mpeg' );
		expect( getExtensionFromMimeType( 'video/webm' ) ).toBe( 'webm' );
	} );

	it( 'should use a fallback extension for unknown image/video mime types', () => {
		expect( getExtensionFromMimeType( 'image/fake' ) ).toBe( 'png' );
		expect( getExtensionFromMimeType( 'video/fake' ) ).toBe( 'mp4' );
	} );

	it( 'should return an empty extension for non image/video mime types', () => {
		expect( getExtensionFromMimeType( 'application/json' ) ).toBe( '' );
		expect( getExtensionFromMimeType( '' ) ).toBe( '' );
		expect( getExtensionFromMimeType( null ) ).toBe( '' );
		expect( getExtensionFromMimeType( undefined ) ).toBe( '' );
	} );
} );
