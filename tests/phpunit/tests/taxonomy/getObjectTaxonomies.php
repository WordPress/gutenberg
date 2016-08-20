<?php

/**
 * @group taxonomy
 */
class Tests_Taxonomy_GetObjectTaxonomies extends WP_UnitTestCase {
	public function setUp() {
		register_post_type( 'wptests_pt' );
		register_taxonomy( 'wptests_tax', 'wptests_pt' );
	}

	public function test_object_should_accept_string() {
		$found = get_object_taxonomies( 'wptests_pt' );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_object_should_accept_array_of_post_type_names() {
		$found = get_object_taxonomies( array( 'wptests_pt' ) );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_object_should_accept_post_object() {
		$p = self::factory()->post->create_and_get( array( 'post_type' => 'wptests_pt' ) );
		$found = get_object_taxonomies( $p );
		$expected = array( 'wptests_tax' );

		$this->assertSame( $expected, $found );
	}

	public function test_should_respect_output_names() {
		$found = get_object_taxonomies( 'wptests_pt', 'objects' );

		$this->assertSame( array( 'wptests_tax' ), array_keys( $found ) );
		$this->assertInternalType( 'object', $found['wptests_tax'] );
		$this->assertSame( 'wptests_tax', $found['wptests_tax']->name );
	}

	public function test_any_value_of_output_other_than_names_should_return_objects() {
		$found = get_object_taxonomies( 'wptests_pt', 'foo' );
		$expected = get_object_taxonomies( 'wptests_pt', 'objects' );

		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 37368
	 */
	public function test_should_return_all_attachment_taxonomies_for_attachment_object_type() {
		register_taxonomy( 'wptests_tax2', 'attachment:image' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_object_taxonomies( $attachment, 'names' );

		$this->assertSame( array( 'wptests_tax2' ), $found );
	}

	/**
	 * @ticket 37368
	 */
	public function test_should_respect_output_objects_when_object_is_attachment() {
		register_taxonomy( 'wptests_tax2', 'attachment:image' );

		$a = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		$attachment = get_post( $a );

		$found = get_object_taxonomies( $attachment, 'objects' );

		$this->assertSame( array( 'wptests_tax2' ), array_keys( $found ) );
		$this->assertInternalType( 'object', $found['wptests_tax2'] );
		$this->assertSame( 'wptests_tax2', $found['wptests_tax2']->name );
	}
}
