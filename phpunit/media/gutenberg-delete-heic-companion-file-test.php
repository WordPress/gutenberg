<?php
/**
 * Tests for gutenberg_delete_heic_companion_file().
 *
 * Covers cleanup of the source-format companion file recorded under the
 * 'source_image' metadata key when its attachment is deleted.
 *
 * @group media
 * @covers ::gutenberg_delete_heic_companion_file
 */
class Gutenberg_Delete_HEIC_Companion_File_Test extends WP_UnitTestCase {

	public function tear_down(): void {
		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * The companion file recorded in metadata['source_image'] is removed from
	 * disk when the attachment is deleted.
	 */
	public function test_deletes_companion_file_recorded_in_metadata_source_image(): void {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$this->assertIsInt( $attachment_id );

		$attached_file = get_attached_file( $attachment_id, true );
		$this->assertIsString( $attached_file );
		$dir       = dirname( $attached_file );
		$heic_name = 'companion-' . wp_generate_password( 6, false ) . '.heic';
		$heic_path = $dir . '/' . $heic_name;

		// Create a dummy companion file on disk.
		file_put_contents( $heic_path, 'test' );
		$this->assertFileExists( $heic_path, 'Test fixture should be on disk.' );

		// Record the companion under metadata['source_image'] as the sideload route does.
		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertIsArray( $metadata );
		$metadata['source_image'] = $heic_name;
		wp_update_attachment_metadata( $attachment_id, $metadata );

		$this->assertTrue(
			gutenberg_delete_heic_companion_file( $attachment_id ),
			'Function should report that a companion file was deleted.'
		);
		$this->assertFileDoesNotExist( $heic_path, 'Companion file should be deleted alongside the attachment.' );
	}

	/**
	 * No companion file is recorded, so the hook is a no-op and attachment
	 * deletion still proceeds normally.
	 */
	public function test_noop_when_metadata_source_image_is_missing(): void {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$this->assertIsInt( $attachment_id );

		// Sanity: no 'source_image' key on freshly-created metadata.
		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertIsArray( $metadata );
		$this->assertArrayNotHasKey( 'source_image', $metadata );

		// Should report no deletion and not raise even though the hook fires.
		$this->assertFalse( gutenberg_delete_heic_companion_file( $attachment_id ) );

		wp_delete_attachment( $attachment_id, true );

		$this->assertNull( get_post( $attachment_id ) );
	}
}
