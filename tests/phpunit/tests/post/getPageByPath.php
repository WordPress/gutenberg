<?php

/**
 * @group post
 */
class Tests_Post_GetPageByPath extends WP_UnitTestCase {
	/**
	 * @ticket 15665
	 */
	public function test_get_page_by_path_priority() {
		global $wpdb;

		$attachment = self::factory()->post->create_and_get( array( 'post_title' => 'some-page', 'post_type' => 'attachment' ) );
		$page       = self::factory()->post->create_and_get( array( 'post_title' => 'some-page', 'post_type' => 'page' ) );
		$other_att  = self::factory()->post->create_and_get( array( 'post_title' => 'some-other-page', 'post_type' => 'attachment' ) );

		$wpdb->update( $wpdb->posts, array( 'post_name' => 'some-page' ), array( 'ID' => $page->ID ) );
		clean_post_cache( $page->ID );

		$page = get_post( $page->ID );

		$this->assertEquals( 'some-page', $attachment->post_name );
		$this->assertEquals( 'some-page', $page->post_name );

		// get_page_by_path() should return a post of the requested type before returning an attachment.
		$this->assertEquals( $page, get_page_by_path( 'some-page' ) );

		// Make sure get_page_by_path() will still select an attachment when a post of the requested type doesn't exist.
		$this->assertEquals( $other_att, get_page_by_path( 'some-other-page' ) );
	}

	public function test_should_match_top_level_page() {
		$page = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$found = get_page_by_path( 'foo' );

		$this->assertSame( $page, $found->ID );
	}

	public function test_should_obey_post_type() {
		register_post_type( 'wptests_pt' );

		$page = self::factory()->post->create( array(
			'post_type' => 'wptests_pt',
			'post_name' => 'foo',
		) );

		$found = get_page_by_path( 'foo' );
		$this->assertNull( $found );

		$found = get_page_by_path( 'foo', OBJECT, 'wptests_pt' );
		$this->assertSame( $page, $found->ID );
	}

	public function test_should_match_nested_page() {
		$p1 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$p2 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'bar',
			'post_parent' => $p1,
		) );

		$p3 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'baz',
			'post_parent' => $p2,
		) );

		$found = get_page_by_path( 'foo/bar/baz' );

		$this->assertSame( $p3, $found->ID );
	}

	public function test_should_not_make_partial_match() {
		$p1 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$p2 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'bar',
			'post_parent' => $p1,
		) );

		$p3 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'baz',
			'post_parent' => $p2,
		) );

		$found = get_page_by_path( 'bar/baz' );

		$this->assertNull( $found );
	}

	public function test_should_not_match_parts_out_of_order() {
		$p1 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$p2 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'bar',
			'post_parent' => $p1,
		) );

		$p3 = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_name' => 'baz',
			'post_parent' => $p2,
		) );

		$found = get_page_by_path( 'bar/foo/baz' );

		$this->assertNull( $found );
	}
}
