/**
 * WordPress dependencies
 */
import { getMediaType } from '@wordpress/media-utils';

describe( 'getMediaType', () => {
	describe( 'REST API format (media_type / mime_type)', () => {
		test( 'returns "image" for media_type: "image"', () => {
			expect( getMediaType( { media_type: 'image' } ) ).toBe( 'image' );
		} );

		test( 'returns "audio" for audio/* mime_type', () => {
			expect(
				getMediaType( { media_type: 'file', mime_type: 'audio/mpeg' } )
			).toBe( 'audio' );
			expect(
				getMediaType( { media_type: 'file', mime_type: 'audio/ogg' } )
			).toBe( 'audio' );
		} );

		test( 'returns "video" for video/* mime_type', () => {
			expect(
				getMediaType( { media_type: 'file', mime_type: 'video/mp4' } )
			).toBe( 'video' );
			expect(
				getMediaType( { media_type: 'file', mime_type: 'video/webm' } )
			).toBe( 'video' );
		} );

		test( 'returns "video" when media_type is "file" and mime_type is absent', () => {
			// REST API uses media_type: 'file' for non-image attachments.
			expect( getMediaType( { media_type: 'file' } ) ).toBe( 'video' );
		} );

		test( 'audio takes precedence over media_type: "file" fallback', () => {
			// mime_type check runs before the media_type fallback.
			expect(
				getMediaType( { media_type: 'file', mime_type: 'audio/wav' } )
			).toBe( 'audio' );
		} );
	} );

	describe( 'media library picker format (type / mime)', () => {
		test( 'returns "audio" for type: "audio"', () => {
			expect(
				getMediaType( { type: 'audio', mime: 'audio/mpeg' } )
			).toBe( 'audio' );
		} );

		test( 'returns "video" for type: "video"', () => {
			expect( getMediaType( { type: 'video', mime: 'video/mp4' } ) ).toBe(
				'video'
			);
		} );

		test( 'returns "image" for type: "image"', () => {
			// media_type check is first; test via media library picker format.
			expect(
				getMediaType( { media_type: 'image', type: 'image' } )
			).toBe( 'image' );
		} );

		test( 'uses mime field when mime_type is absent', () => {
			expect( getMediaType( { mime: 'audio/ogg' } ) ).toBe( 'audio' );
			expect( getMediaType( { mime: 'video/mp4' } ) ).toBe( 'video' );
		} );
	} );

	describe( 'fallback behaviour', () => {
		test( 'returns null for nullish input', () => {
			expect( getMediaType( null ) ).toBeNull();
			expect( getMediaType( undefined ) ).toBeNull();
		} );

		test( 'defaults to "image" when no recognisable fields are present', () => {
			expect( getMediaType( {} ) ).toBe( 'image' );
		} );

		test( 'type: "audio" fallback fires when mime fields are absent', () => {
			expect( getMediaType( { type: 'audio' } ) ).toBe( 'audio' );
		} );

		test( 'type: "video" fallback fires when mime fields are absent', () => {
			expect( getMediaType( { type: 'video' } ) ).toBe( 'video' );
		} );
	} );
} );
