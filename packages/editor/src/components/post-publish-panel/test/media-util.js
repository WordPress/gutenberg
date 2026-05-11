/**
 * Internal dependencies
 */
import { generateUniqueBasenames } from '../media-util';

describe( 'generateUniqueBasenames', () => {
	it( 'should prefer the original basenames', () => {
		const urls = [
			'https://example.com/images/image1.jpg',
			'https://example.com/images/image2.jpg',
			'https://example.com/images/image3.jpg',
			'https://example.com/images/image4.jpg',
		];

		expect( generateUniqueBasenames( urls ) ).toEqual( {
			'https://example.com/images/image1.jpg': 'image1',
			'https://example.com/images/image2.jpg': 'image2',
			'https://example.com/images/image3.jpg': 'image3',
			'https://example.com/images/image4.jpg': 'image4',
		} );
	} );

	it( 'should handle filenames with no extensions', () => {
		const urls = [
			'https://example.com/images/image1',
			'https://example.com/images/image2',
			'https://example.com/images/image3',
			'https://example.com/images/image4',
		];

		expect( generateUniqueBasenames( urls ) ).toEqual( {
			'https://example.com/images/image1': 'image1',
			'https://example.com/images/image2': 'image2',
			'https://example.com/images/image3': 'image3',
			'https://example.com/images/image4': 'image4',
		} );
	} );

	it( 'should handle query parameters correctly', () => {
		const urls = [
			'https://example.com/images/image1.jpg?a=notafile.npg',
			'https://example.com/images/image2.jpg?a=notafile.npg',
			'https://example.com/images/image3.jpg?a=notafile.npg',
			'https://example.com/images/image4.jpg?a=notafile.npg',
		];

		expect( generateUniqueBasenames( urls ) ).toEqual( {
			'https://example.com/images/image1.jpg?a=notafile.npg': 'image1',
			'https://example.com/images/image2.jpg?a=notafile.npg': 'image2',
			'https://example.com/images/image3.jpg?a=notafile.npg': 'image3',
			'https://example.com/images/image4.jpg?a=notafile.npg': 'image4',
		} );
	} );

	it( 'should deduplicate identical filenames', () => {
		const urls = [
			'https://example.com/image1/image.jpg',
			'https://example.com/image2/image.jpg',
			'https://example.com/image3/image.jpg',
			'https://example.com/image4/image.jpg',
		];

		const results = generateUniqueBasenames( urls );
		const resultLength = Object.entries( results ).length;
		expect( resultLength ).toBe( urls.length );

		const basenames = new Set( Object.values( results ) );
		expect( basenames.size ).toBe( resultLength );
	} );

	it( 'should deduplicate identical basenames', () => {
		const urls = [
			'https://example.com/images/image.jpg',
			'https://example.com/images/image.png',
			'https://example.com/images/image.webp',
			'https://example.com/images/image.avif',
		];

		const results = generateUniqueBasenames( urls );
		const resultLength = Object.entries( results ).length;
		expect( resultLength ).toBe( urls.length );

		const basenames = new Set( Object.values( results ) );
		expect( basenames.size ).toBe( resultLength );
	} );

	it( 'should deduplicate filenames without extensions', () => {
		const urls = [
			'https://example.com/image1/image',
			'https://example.com/image2/image',
			'https://example.com/image3/image',
			'https://example.com/image4/image',
		];

		const results = generateUniqueBasenames( urls );
		const resultLength = Object.entries( results ).length;
		expect( resultLength ).toBe( urls.length );

		const basenames = new Set( Object.values( results ) );
		expect( basenames.size ).toBe( resultLength );
	} );

	it( 'should deduplicate paths with no filename', () => {
		const urls = [
			'https://example.com/image1/dir/',
			'https://example.com/image2/dir/',
			'https://example.com/image3/dir/',
			'https://example.com/image4/dir/',
		];

		const results = generateUniqueBasenames( urls );
		const resultLength = Object.entries( results ).length;
		expect( resultLength ).toBe( urls.length );

		const basenames = new Set( Object.values( results ) );
		expect( basenames.size ).toBe( resultLength );
	} );
} );
