<?php

/**
 * @group post
 * @covers ::get_post_class
 */
class Tests_Post_GetPostClass extends WP_UnitTestCase {
	protected $post_id;

	public function setUp() {
		parent::setUp();
		$this->post_id = $this->factory->post->create();
	}

	public function test_with_tags() {
		wp_set_post_terms( $this->post_id, array( 'foo', 'bar' ), 'post_tag' );

		$found = get_post_class( '', $this->post_id );

		$this->assertContains( 'tag-foo', $found );
		$this->assertContains( 'tag-bar', $found );
	}

	public function test_with_categories() {
		$cats = $this->factory->category->create_many( 2 );
		wp_set_post_terms( $this->post_id, $cats, 'category' );

		$cat0 = get_term( $cats[0], 'category' );
		$cat1 = get_term( $cats[1], 'category' );

		$found = get_post_class( '', $this->post_id );

		$this->assertContains( 'category-' . $cat0->slug, $found );
		$this->assertContains( 'category-' . $cat1->slug, $found );
	}

	public function test_with_custom_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		wp_set_post_terms( $this->post_id, array( 'foo', 'bar' ), 'wptests_tax' );

		$found = get_post_class( '', $this->post_id );

		$this->assertContains( 'wptests_tax-foo', $found );
		$this->assertContains( 'wptests_tax-bar', $found );
	}

	/**
	 * @ticket 22271
	 */
	public function test_with_custom_classes_and_no_post() {
		$this->assertEquals( array(), get_post_class( '', null ) );
		$this->assertEquals( array( 'foo' ), get_post_class( 'foo', null ) );
		$this->assertEquals( array( 'foo', 'bar' ),  get_post_class( array( 'foo', 'bar' ), null ) );
	}

	/**
	 * @group cache
	 */
	public function test_taxonomy_classes_hit_cache() {
		global $wpdb;

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		register_taxonomy( 'wptests_tax', 'post' );
		wp_set_post_terms( $this->post_id, array( 'foo', 'bar' ), 'wptests_tax' );
		wp_set_post_terms( $this->post_id, array( 'footag', 'bartag' ), 'post_tag' );

		// Prime cache, including meta cache, which is used by get_post_class().
		update_object_term_cache( $this->post_id, 'post' );
		update_meta_cache( 'post', $this->post_id );

		$num_queries = $wpdb->num_queries;

		$found = get_post_class( '', $this->post_id );

		$this->assertSame( $num_queries, $wpdb->num_queries );
	}
}
