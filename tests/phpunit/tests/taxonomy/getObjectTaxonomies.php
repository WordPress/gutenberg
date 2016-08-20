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
}
