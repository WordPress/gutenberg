<?php

/**
 * @group media
 * @group taxonomy
 */
class Tests_Media_GetAttachmentTaxonomies extends WP_UnitTestCase {
	public function test_should_return_attachment_taxonomy() {
		register_taxonomy( 'wptests_tax', 'attachment' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_attachment_taxonomies( $attachment, 'names' );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_should_return_taxonomy_registered_for_specific_attachment_type() {
		register_taxonomy( 'wptests_tax', 'attachment:image' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_attachment_taxonomies( $attachment, 'names' );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_should_return_taxonomy_registered_for_specific_attachment_mimetype() {
		register_taxonomy( 'wptests_tax', 'attachment:image/jpeg' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_attachment_taxonomies( $attachment, 'names' );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_should_return_taxonomy_registered_for_specific_file_extension() {
		register_taxonomy( 'wptests_tax', 'attachment:jpg' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_attachment_taxonomies( $attachment, 'names' );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_should_not_return_duplicate_taxonomies() {
		register_taxonomy( 'wptests_tax', array( 'attachment', 'attachment:image/jpeg' ) );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_attachment_taxonomies( $attachment, 'names' );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 37368
	 */
	public function test_should_respect_output_objects() {
		register_taxonomy( 'wptests_tax2', 'attachment:image' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_attachment_taxonomies( $attachment, 'objects' );

		$this->assertSame( array( 'wptests_tax2' ), array_keys( $found ) );
		$this->assertInternalType( 'object', $found['wptests_tax2'] );
		$this->assertSame( 'wptests_tax2', $found['wptests_tax2']->name );
	}
}
