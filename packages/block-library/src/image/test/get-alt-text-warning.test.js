import { describe, expect, it } from 'vitest';
import { getAltTextWarning } from '../get-alt-text-warning';

describe( 'getAltTextWarning', () => {
	it( 'returns null when there is nothing to warn about', () => {
		expect(
			getAltTextWarning( {
				alt: 'A dog catching a frisbee in a park',
				caption: '',
				url: 'https://example.com/dog.jpg',
				isLinked: false,
			} )
		).toBeNull();
	} );

	it( 'returns null for an empty, unlinked image', () => {
		expect(
			getAltTextWarning( {
				alt: '',
				caption: '',
				url: 'https://example.com/dog.jpg',
				isLinked: false,
			} )
		).toBeNull();
	} );

	it( 'warns when a linked image has no alt text', () => {
		const warning = getAltTextWarning( {
			alt: '',
			caption: '',
			url: 'https://example.com/dog.jpg',
			isLinked: true,
		} );

		expect( warning?.message ).toMatch( /linked images/i );
	} );

	it.each( [ 'IMG_1234', 'DSC_0042', 'img-5678', 'Screenshot 2024-05-01' ] )(
		'warns when the alt text looks like a file name pattern: %s',
		( alt ) => {
			const warning = getAltTextWarning( {
				alt,
				caption: '',
				url: 'https://example.com/photo.jpg',
				isLinked: false,
			} );

			expect( warning?.message ).toMatch( /file name/i );
		}
	);

	it( 'warns when the alt text matches the actual file name', () => {
		const warning = getAltTextWarning( {
			alt: 'vacation-photo-2024',
			caption: '',
			url: 'https://example.com/path/vacation-photo-2024.jpg',
			isLinked: false,
		} );

		expect( warning?.message ).toMatch( /file name/i );
	} );

	it.each( [ 'image', 'Photo', 'PICTURE', 'graphic' ] )(
		'warns when the alt text is only a generic word: %s',
		( alt ) => {
			const warning = getAltTextWarning( {
				alt,
				caption: '',
				url: 'https://example.com/DSCN0294837.jpg',
				isLinked: false,
			} );

			expect( warning?.message ).toMatch(
				/does not meaningfully describe/i
			);
		}
	);

	it( 'warns when the alt text duplicates the caption', () => {
		const warning = getAltTextWarning( {
			alt: 'A dog catching a frisbee',
			caption: 'A dog catching a frisbee',
			url: 'https://example.com/dog.jpg',
			isLinked: false,
		} );

		expect( warning?.message ).toMatch( /caption and alt attribute/i );
	} );

	it( 'does not warn about a duplicate caption when alt is a file name (higher priority)', () => {
		const warning = getAltTextWarning( {
			alt: 'IMG_1234',
			caption: 'IMG_1234',
			url: 'https://example.com/photo.jpg',
			isLinked: false,
		} );

		expect( warning?.message ).toMatch( /file name/i );
	} );

	it( 'warns when the alt text is unusually long', () => {
		const warning = getAltTextWarning( {
			alt: 'A '.repeat( 100 ),
			caption: '',
			url: 'https://example.com/dog.jpg',
			isLinked: false,
		} );

		expect( warning?.message ).toMatch( /very long/i );
	} );

	it( 'does not warn about length for a reasonably sized description', () => {
		const warning = getAltTextWarning( {
			alt: 'A golden retriever leaping to catch a red frisbee mid-air in a sunny park, with trees in the background.',
			caption: '',
			url: 'https://example.com/dog.jpg',
			isLinked: false,
		} );

		expect( warning ).toBeNull();
	} );
} );
