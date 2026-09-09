import { describe, expect, test } from 'vitest';
import { attributesFromMedia } from '../shared';

describe( 'attributesFromMedia', () => {
	test( 'keeps the selected size for media picked from the library', () => {
		expect(
			attributesFromMedia( {
				id: 7,
				url: 'https://example.com/photo.jpg',
				alt: 'A photo',
				type: 'image',
			} )
		).toStrictEqual( {
			url: 'https://example.com/photo.jpg',
			id: 7,
			alt: 'A photo',
			backgroundType: 'image',
		} );
	} );

	test( 'clears the selected size for media that is not in the library', () => {
		// An external URL has no registered image sizes, so a size slug left
		// over from a previously selected library image no longer applies.
		expect(
			attributesFromMedia( {
				url: 'https://example.com/photo.jpg',
				type: 'image',
			} )
		).toStrictEqual( {
			url: 'https://example.com/photo.jpg',
			id: undefined,
			alt: undefined,
			backgroundType: 'image',
			sizeSlug: undefined,
		} );
	} );

	test( 'resets the parallax setting when the media is a video', () => {
		expect(
			attributesFromMedia( {
				url: 'https://example.com/clip.mp4',
				type: 'video',
			} )
		).toStrictEqual( {
			url: 'https://example.com/clip.mp4',
			id: undefined,
			alt: undefined,
			backgroundType: 'video',
			sizeSlug: undefined,
			hasParallax: undefined,
		} );
	} );
} );
