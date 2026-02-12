/**
 * Internal dependencies
 */
import { getTrackAriaLabel, getTrackAttributes } from '../edit';

// Mock uuid to return predictable values.
jest.mock( 'uuid', () => ( {
	v4: jest.fn( () => 'mock-uuid-1234' ),
} ) );

describe( 'Playlist block edit utilities', () => {
	describe( 'getTrackAriaLabel', () => {
		it( 'should return formatted label with title, artist, and album', () => {
			const track = {
				title: 'My Song',
				artist: 'The Artist',
				album: 'Great Album',
			};
			const result = getTrackAriaLabel( track );
			expect( result ).toBe(
				'My Song by The Artist from the album Great Album'
			);
		} );

		it( 'should return just the title when artist or album is missing', () => {
			const trackWithoutArtist = {
				title: 'My Song',
				album: 'Great Album',
			};
			expect( getTrackAriaLabel( trackWithoutArtist ) ).toBe( 'My Song' );

			const trackWithoutAlbum = {
				title: 'My Song',
				artist: 'The Artist',
			};
			expect( getTrackAriaLabel( trackWithoutAlbum ) ).toBe( 'My Song' );
		} );

		it( 'should return "Untitled" when track has no title', () => {
			expect( getTrackAriaLabel( {} ) ).toBe( 'Untitled' );
			expect( getTrackAriaLabel( { artist: 'The Artist' } ) ).toBe(
				'Untitled'
			);
		} );

		it( 'should handle undefined or null track', () => {
			expect( getTrackAriaLabel( undefined ) ).toBe( 'Untitled' );
			expect( getTrackAriaLabel( null ) ).toBe( 'Untitled' );
		} );

		it( 'should strip HTML from title', () => {
			const track = {
				title: '<script>alert("xss")</script>My Song',
			};
			const result = getTrackAriaLabel( track );
			expect( result ).not.toContain( '<script>' );
		} );
	} );

	describe( 'getTrackAttributes', () => {
		it( 'should transform media object to track attributes', () => {
			const media = {
				id: 123,
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				artist: 'The Artist',
				album: 'Great Album',
				fileLength: '3:45',
				image: { src: 'https://example.com/cover.jpg' },
			};

			const result = getTrackAttributes( media );

			expect( result ).toEqual( {
				id: 123,
				uniqueId: 'mock-uuid-1234',
				src: 'https://example.com/song.mp3',
				title: 'My Song',
				artist: 'The Artist',
				album: 'Great Album',
				length: '3:45',
				image: 'https://example.com/cover.jpg',
			} );
		} );

		it( 'should use URL as id when attachment id is not available', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
			};

			const result = getTrackAttributes( media );

			expect( result.id ).toBe( 'https://example.com/song.mp3' );
		} );

		it( 'should fall back to meta.artist when artist is not available', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				meta: { artist: 'Meta Artist' },
			};

			const result = getTrackAttributes( media );

			expect( result.artist ).toBe( 'Meta Artist' );
		} );

		it( 'should fall back to media_details.artist when artist and meta.artist are not available', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				media_details: { artist: 'Media Details Artist' },
			};

			const result = getTrackAttributes( media );

			expect( result.artist ).toBe( 'Media Details Artist' );
		} );

		it( 'should use "Unknown artist" when no artist is available', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
			};

			const result = getTrackAttributes( media );

			expect( result.artist ).toBe( 'Unknown artist' );
		} );

		it( 'should use "Unknown album" when no album is available', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
			};

			const result = getTrackAttributes( media );

			expect( result.album ).toBe( 'Unknown album' );
		} );

		it( 'should use media_details.length_formatted when fileLength is not available', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				media_details: { length_formatted: '4:30' },
			};

			const result = getTrackAttributes( media );

			expect( result.length ).toBe( '4:30' );
		} );

		it( 'should exclude default audio icon from image', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				image: {
					src: 'https://example.com/wp-includes/images/media/audio.svg',
				},
			};

			const result = getTrackAttributes( media );

			expect( result.image ).toBe( '' );
		} );

		it( 'should include valid image URLs', () => {
			const media = {
				url: 'https://example.com/song.mp3',
				title: 'My Song',
				image: { src: 'https://example.com/cover.jpg' },
			};

			const result = getTrackAttributes( media );

			expect( result.image ).toBe( 'https://example.com/cover.jpg' );
		} );
	} );
} );
