/**
 * Tests for the Attachment type against real REST API responses.
 *
 * These tests validate the Attachment type definition by comparing it with
 * real JSON responses from the WordPress REST API's media endpoint. The fixtures
 * are from the REST API's edit context, which includes edit-only fields like
 * permalink_template, generated_slug, and missing_image_sizes.
 */

/**
 * Internal dependencies
 */
import type { Attachment } from '../attachment';
import imageAttachmentFixture from './fixtures/attachment-image.json';
import zipAttachmentFixture from './fixtures/attachment-zip.json';
import audioAttachmentFixture from './fixtures/attachment-audio.json';
import videoAttachmentFixture from './fixtures/attachment-video.json';

describe( 'Attachment type', () => {
	describe( 'Image attachment', () => {
		it( 'should validate against real image attachment from REST API', () => {
			const attachment: Attachment< 'edit' > =
				imageAttachmentFixture as unknown as Attachment< 'edit' >;

			// Edit-context fields
			expect( attachment.permalink_template ).toBeDefined();
			expect( attachment.generated_slug ).toBeDefined();
			expect( attachment.missing_image_sizes ).toBeDefined();

			// Image-specific properties
			expect( attachment.media_type ).toBe( 'image' );
			expect( attachment.media_details.width ).toBeGreaterThan( 0 );
			expect( attachment.media_details.height ).toBeGreaterThan( 0 );
			expect( attachment.media_details.sizes ).toBeDefined();
		} );
	} );

	describe( 'Zip file attachment', () => {
		it( 'should validate against real zip file attachment from REST API', () => {
			const attachment: Attachment< 'edit' > =
				zipAttachmentFixture as unknown as Attachment< 'edit' >;

			// Edit-context fields
			expect( attachment.permalink_template ).toBeDefined();
			expect( attachment.generated_slug ).toBeDefined();

			// File-type properties
			expect( attachment.media_type ).toBe( 'file' );
			expect( attachment.mime_type ).toBe( 'application/zip' );
			expect( attachment.media_details.filesize ).toBeGreaterThan( 0 );

			// Files don't have dimensions
			expect( attachment.media_details.width ).toBeUndefined();
			expect( attachment.media_details.height ).toBeUndefined();
		} );
	} );

	describe( 'Audio file attachment', () => {
		it( 'should validate against real audio attachment from REST API', () => {
			const attachment: Attachment< 'edit' > =
				audioAttachmentFixture as unknown as Attachment< 'edit' >;

			// Edit-context fields
			expect( attachment.permalink_template ).toBeDefined();
			expect( attachment.generated_slug ).toBeDefined();

			// Audio-type properties
			expect( attachment.media_type ).toBe( 'file' );
			expect( attachment.mime_type ).toBe( 'audio/mpeg' );
			expect( attachment.media_details.length ).toBeGreaterThan( 0 );
			expect( attachment.media_details.bitrate ).toBeGreaterThan( 0 );

			// Audio files don't have dimensions
			expect( attachment.media_details.width ).toBeUndefined();
			expect( attachment.media_details.height ).toBeUndefined();
		} );
	} );

	describe( 'Video file attachment', () => {
		it( 'should validate against real video attachment from REST API', () => {
			const attachment: Attachment< 'edit' > =
				videoAttachmentFixture as unknown as Attachment< 'edit' >;

			// Edit-context fields
			expect( attachment.permalink_template ).toBeDefined();
			expect( attachment.generated_slug ).toBeDefined();

			// Video-type properties
			expect( attachment.media_type ).toBe( 'file' );
			expect( attachment.mime_type ).toBe( 'video/mp4' );
			expect( attachment.media_details.width ).toBeGreaterThan( 0 );
			expect( attachment.media_details.height ).toBeGreaterThan( 0 );
			expect( attachment.media_details.length ).toBeGreaterThan( 0 );
		} );
	} );
} );
