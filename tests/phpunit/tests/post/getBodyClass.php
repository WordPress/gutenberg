<?php

/**
 * @group post
 * @covers ::get_body_class
 */
class Tests_Post_GetBodyClass extends WP_UnitTestCase {
	protected $post_id;

	public function setUp() {
		parent::setUp();
		$this->post_id = self::factory()->post->create();
	}

	/**
	 * @ticket 30883
	 */
	public function test_with_utf8_category_slugs() {
		$cat_id1 = self::factory()->category->create( array( 'name' => 'Первая рубрика' ) );
		$cat_id2 = self::factory()->category->create( array( 'name' => 'Вторая рубрика' ) );
		$cat_id3 = self::factory()->category->create( array( 'name' => '25кадр' ) );
		wp_set_post_terms( $this->post_id, array( $cat_id1, $cat_id2, $cat_id3 ), 'category' );

		$this->go_to( home_url( "?cat=$cat_id1" ) );
		$this->assertContains( "category-$cat_id1", get_body_class() );

		$this->go_to( home_url( "?cat=$cat_id2" ) );
		$this->assertContains( "category-$cat_id2", get_body_class() );

		$this->go_to( home_url( "?cat=$cat_id3" ) );
		$this->assertContains( "category-$cat_id3", get_body_class() );
	}

	/**
	 * @ticket 30883
	 */
	public function test_with_utf8_tag_slugs() {
		$tag_id1 = self::factory()->tag->create( array( 'name' => 'Первая метка' ) );
		$tag_id2 = self::factory()->tag->create( array( 'name' => 'Вторая метка' ) );
		$tag_id3 = self::factory()->tag->create( array( 'name' => '25кадр' ) );
		wp_set_post_terms( $this->post_id, array( $tag_id1, $tag_id2, $tag_id3 ), 'post_tag' );

		$tag1 = get_term( $tag_id1, 'post_tag' );
		$tag2 = get_term( $tag_id2, 'post_tag' );
		$tag3 = get_term( $tag_id3, 'post_tag' );

		$this->go_to( home_url( "?tag={$tag1->slug}" ) );
		$this->assertContains( "tag-$tag_id1", get_body_class() );

		$this->go_to( home_url( "?tag={$tag2->slug}" ) );
		$this->assertContains( "tag-$tag_id2", get_body_class() );

		$this->go_to( home_url( "?tag={$tag3->slug}" ) );
		$this->assertContains( "tag-$tag_id3", get_body_class() );
	}

	/**
	 * @ticket 30883
	 */
	public function test_with_utf8_term_slugs() {
		register_taxonomy( 'wptests_tax', 'post' );
		$term_id1 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => 'Первая метка' ) );
		$term_id2 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => 'Вторая метка' ) );
		$term_id3 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => '25кадр' ) );
		wp_set_post_terms( $this->post_id, array( $term_id1, $term_id2, $term_id3 ), 'wptests_tax' );

		$term1 = get_term( $term_id1, 'wptests_tax' );
		$term2 = get_term( $term_id2, 'wptests_tax' );
		$term3 = get_term( $term_id3, 'wptests_tax' );

		$this->go_to( home_url( "?wptests_tax={$term1->slug}" ) );
		$this->assertContains( "term-$term_id1", get_body_class() );

		$this->go_to( home_url( "?wptests_tax={$term2->slug}" ) );
		$this->assertContains( "term-$term_id2", get_body_class() );

		$this->go_to( home_url( "?wptests_tax={$term3->slug}" ) );
		$this->assertContains( "term-$term_id3", get_body_class() );
	}

	/**
	 * @ticket 35164
	 * @ticket 36510
	 */
	public function test_singular_body_classes() {
		$post_id = self::factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );

		$class = get_body_class();
		$this->assertContains( "single-post", $class );
		$this->assertContains( "postid-{$post_id}", $class );
		$this->assertContains( "single-format-standard", $class );
	}

}
