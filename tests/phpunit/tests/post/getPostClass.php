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
	 * @ticket 30883
	 */
	public function test_with_utf8_category_slugs() {
		$cat_id1 = $this->factory->category->create( array( 'name' => 'Первая рубрика' ) );
		$cat_id2 = $this->factory->category->create( array( 'name' => 'Вторая рубрика' ) );
		$cat_id3 = $this->factory->category->create( array( 'name' => '25кадр' ) );
		wp_set_post_terms( $this->post_id, array( $cat_id1, $cat_id2, $cat_id3 ), 'category' );

		$found = get_post_class( '', $this->post_id );

		$this->assertContains( "category-$cat_id1", $found );
		$this->assertContains( "category-$cat_id2", $found );
		$this->assertContains( "category-$cat_id3", $found );
	}

	/**
	 * @ticket 30883
	 */
	public function test_with_utf8_tag_slugs() {
		$tag_id1 = $this->factory->tag->create( array( 'name' => 'Первая метка' ) );
		$tag_id2 = $this->factory->tag->create( array( 'name' => 'Вторая метка' ) );
		$tag_id3 = $this->factory->tag->create( array( 'name' => '25кадр' ) );
		wp_set_post_terms( $this->post_id, array( $tag_id1, $tag_id2, $tag_id3 ), 'post_tag' );

		$found = get_post_class( '', $this->post_id );

		$this->assertContains( "tag-$tag_id1", $found );
		$this->assertContains( "tag-$tag_id2", $found );
		$this->assertContains( "tag-$tag_id3", $found );
	}

	/**
	 * @ticket 30883
	 */
	public function test_with_utf8_term_slugs() {
		register_taxonomy( 'wptests_tax', 'post' );
		$term_id1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => 'Первая метка' ) );
		$term_id2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => 'Вторая метка' ) );
		$term_id3 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => '25кадр' ) );
		wp_set_post_terms( $this->post_id, array( $term_id1, $term_id2, $term_id3 ), 'wptests_tax' );

		$found = get_post_class( '', $this->post_id );

		$this->assertContains( "wptests_tax-$term_id1", $found );
		$this->assertContains( "wptests_tax-$term_id2", $found );
		$this->assertContains( "wptests_tax-$term_id3", $found );
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

		// The 'site_icon' option check adds a query during unit tests. See {@see WP_Site_Icon::get_post_metadata()}.
		$expected_num_queries = $num_queries + 1;

		$this->assertSame( $expected_num_queries, $wpdb->num_queries );
	}
}
