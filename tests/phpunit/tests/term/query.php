<?php

/**
 * @group taxonomy
 */
class Tests_Tax_Query extends WP_UnitTestCase {
	protected $q;

	function setUp() {
		parent::setUp();
		unset( $this->q );
		$this->q = new WP_Query();
	}

	function test_category__and_var() {
		$term_id = $this->factory->category->create( array( 'slug' => 'woo', 'name' => 'WOO!' ) );
		$term_id2 = $this->factory->category->create( array( 'slug' => 'hoo', 'name' => 'HOO!' ) );
		$post_id = $this->factory->post->create();

		wp_set_post_categories( $post_id, $term_id );

		$posts = $this->q->query( array( 'category__and' => array( $term_id ) ) );

		$this->assertEmpty( $this->q->get( 'category__and' ) );
		$this->assertCount( 0, $this->q->get( 'category__and' ) );
		$this->assertNotEmpty( $this->q->get( 'category__in' ) );
		$this->assertCount( 1, $this->q->get( 'category__in' ) );

		$this->assertNotEmpty( $posts );
		$this->assertEquals( array( $post_id ), wp_list_pluck( $posts, 'ID' ) );

		$posts2 = $this->q->query( array( 'category__and' => array( $term_id, $term_id2 ) ) );
		$this->assertNotEmpty( $this->q->get( 'category__and' ) );
		$this->assertCount( 2, $this->q->get( 'category__and' ) );
		$this->assertEmpty( $this->q->get( 'category__in' ) );
		$this->assertCount( 0, $this->q->get( 'category__in' ) );

		$this->assertEmpty( $posts2 );
	}

	function test_taxonomy_with_attachments() {
		register_taxonomy_for_object_type( 'post_tag', 'attachment:image' );
		$tag_id = $this->factory->term->create( array( 'slug' => rand_str(), 'name' => rand_str() ) );
		$image_id = $this->factory->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		wp_set_object_terms( $image_id, $tag_id, 'post_tag' );

		$posts = $this->q->query( array(
			'fields' => 'ids',
			'post_type' => 'attachment',
			'post_status' => 'inherit',
			'tax_query' => array(
				array(
					'taxonomy' => 'post_tag',
					'field' => 'term_id',
					'terms' => array( $tag_id )
				)
			)
		) );

		$this->assertEquals( array( $image_id ), $posts );
	}
}