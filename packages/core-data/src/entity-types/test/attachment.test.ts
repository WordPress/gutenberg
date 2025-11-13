/**
 * Tests for the Attachment type against real REST API responses.
 *
 * These tests validate the Attachment type definition by comparing it with
 * real JSON responses from the WordPress REST API's media endpoint. The fixtures
 * are from the REST API's view context, which excludes edit-only fields like
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
			const attachment: Attachment< 'view' > =
				imageAttachmentFixture as Attachment< 'view' >;

			expect( attachment.id ).toBeDefined();
			expect( attachment.id ).toBeGreaterThan( 0 );
			expect( attachment.media_type ).toBeDefined();
			expect( attachment.mime_type ).toBeDefined();
			expect( attachment.source_url ).toBeDefined();
		} );
	} );

	describe( 'Zip file attachment', () => {
		it( 'should validate against real zip file attachment from REST API', () => {
			const attachment: Attachment< 'view' > =
				zipAttachmentFixture as Attachment< 'view' >;

			expect( attachment.id ).toBeDefined();
			expect( attachment.media_type ).toBeDefined();
			expect( attachment.mime_type ).toBeDefined();
			expect( attachment.source_url ).toBeDefined();
		} );
	} );

	describe( 'Audio file attachment', () => {
		it( 'should validate against real audio attachment from REST API', () => {
			const attachment: Attachment< 'view' > =
				audioAttachmentFixture as Attachment< 'view' >;

			expect( attachment.id ).toBeDefined();
			expect( attachment.media_type ).toBeDefined();
			expect( attachment.mime_type ).toBeDefined();
			expect( attachment.source_url ).toBeDefined();
		} );
	} );

	describe( 'Video file attachment', () => {
		it( 'should validate against real video attachment from REST API', () => {
			const attachment: Attachment< 'view' > =
				videoAttachmentFixture as Attachment< 'view' >;

			expect( attachment.id ).toBeDefined();
			expect( attachment.media_type ).toBeDefined();
			expect( attachment.mime_type ).toBeDefined();
			expect( attachment.source_url ).toBeDefined();
		} );
	} );
} );
