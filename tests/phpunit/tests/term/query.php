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

	/**
	 * @ticket 27193
	 */
	function test_cat_or_tag() {
		$category1 = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'alpha' ) );
		$category2 = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'beta' ) );

		$tag1 = $this->factory->term->create( array( 'taxonomy' => 'post_tag', 'name' => 'gamma' ) );
		$tag2 = $this->factory->term->create( array( 'taxonomy' => 'post_tag', 'name' => 'delta' ) );

		$post_id1 = $this->factory->post->create( array( 'post_title' => 'alpha', 'post_category' => array( $category1 ) ) );
		$terms1 = get_the_category( $post_id1 );
		$this->assertEquals( array( get_category( $category1 ) ), $terms1 );

		$post_id2 = $this->factory->post->create( array( 'post_title' => 'beta', 'post_category' => array( $category2 ) ) );
		$terms2 = get_the_category( $post_id2 );
		$this->assertEquals( array( get_category( $category2 ) ), $terms2 );

		$post_id3 = $this->factory->post->create( array( 'post_title' => 'gamma', 'post_tag' => array( $tag1 ) ) );
		$post_id4 = $this->factory->post->create( array( 'post_title' => 'delta', 'post_tag' => array( $tag2 ) ) );

		$query = new WP_Query( array(
			'fields' => 'ids',
			'tax_query' => array(
				//'relation' => 'OR',
				array(
					'taxonomy' => 'category',
					'field' => 'term_id',
					'terms' => array( $category1, $category2 )
				)
			)
		) );
		$ids = $query->get_posts();
		$this->assertEquals( array( $post_id1, $post_id2 ), $ids );
	}

	function test_tax_query_no_taxonomy() {
		$cat_id = $this->factory->category->create( array( 'name' => 'alpha' ) );
		$this->factory->post->create( array( 'post_title' => 'alpha', 'post_category' => array( $cat_id ) ) );

		$response1 = new WP_Query( array(
			'tax_query' => array(
				array( 'terms' => array( $cat_id ) )
			)
		) );
		$this->assertEmpty( $response1->posts );

		$response2 = new WP_Query( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( $cat_id )
				)
			)
		) );
		$this->assertNotEmpty( $response2->posts );

		$term = get_category( $cat_id );
		$response3 = new WP_Query( array(
			'tax_query' => array(
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $term->term_taxonomy_id )
				)
			)
		) );
		$this->assertNotEmpty( $response3->posts );
	}

	function test_term_taxonomy_id_field_no_taxonomy() {
		$posts = $this->factory->post->create_many( 5 );

		$cats = $tags = array();

		// need term_taxonomy_ids in addition to term_ids, so no factory
		for ( $i = 0; $i < 5; $i++ ) {
			$cats[$i] = wp_insert_term( 'category-' . $i , 'category' );
			$tags[$i] = wp_insert_term( 'tag-' . $i, 'post_tag' );

			// post 0 gets all terms
			wp_set_object_terms( $posts[0], array( $cats[$i]['term_id'] ), 'category', true );
			wp_set_object_terms( $posts[0], array( $tags[$i]['term_id'] ), 'post_tag', true );
		}

		wp_set_object_terms( $posts[1], array( $cats[0]['term_id'], $cats[2]['term_id'], $cats[4]['term_id'] ), 'category' );
		wp_set_object_terms( $posts[1], array( $tags[0]['term_id'], $tags[2]['term_id'], $cats[4]['term_id'] ), 'post_tag' );

		wp_set_object_terms( $posts[2], array( $cats[1]['term_id'], $cats[3]['term_id'] ), 'category' );
		wp_set_object_terms( $posts[2], array( $tags[1]['term_id'], $tags[3]['term_id'] ), 'post_tag' );

		wp_set_object_terms( $posts[3], array( $cats[0]['term_id'], $cats[2]['term_id'], $cats[4]['term_id'] ), 'category' );
		wp_set_object_terms( $posts[3], array( $tags[1]['term_id'], $tags[3]['term_id'] ), 'post_tag' );

		$results1 = $this->q->query( array(
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[0]['term_taxonomy_id'], $cats[2]['term_taxonomy_id'], $cats[4]['term_taxonomy_id'], $tags[0]['term_taxonomy_id'], $tags[2]['term_taxonomy_id'], $cats[4]['term_taxonomy_id'] ),
					'operator' => 'AND',
					'include_children' => false,
				),
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[1]['term_taxonomy_id'], $cats[3]['term_taxonomy_id'], $tags[1]['term_taxonomy_id'], $tags[3]['term_taxonomy_id'] ),
					'operator' => 'AND',
					'include_children' => false,
				)
			)
		) );

		$this->assertEquals( array( $posts[0], $posts[1], $posts[2] ), $results1, 'Relation: OR; Operator: AND' );

		$results2 = $this->q->query( array(
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				'relation' => 'AND',
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[0]['term_taxonomy_id'], $tags[0]['term_taxonomy_id'] ),
					'operator' => 'IN',
					'include_children' => false,
				),
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[3]['term_taxonomy_id'], $tags[3]['term_taxonomy_id'] ),
					'operator' => 'IN',
					'include_children' => false,
				)
			)
		) );

		$this->assertEquals( array( $posts[0], $posts[3] ), $results2, 'Relation: AND; Operator: IN' );
	}

	/**
	 * @ticket 28099
	 */
	function test_empty__in() {
		$cat_id = $this->factory->category->create();
		$post_id = $this->factory->post->create();
		wp_set_post_categories( $post_id, $cat_id );

		$q1 = get_posts( array( 'category__in' => array( $cat_id ) ) );
		$this->assertNotEmpty( $q1 );
		$q2 = get_posts( array( 'category__in' => array() ) );
		$this->assertNotEmpty( $q2 );

		$tag = wp_insert_term( 'woo', 'post_tag' );
		$tag_id = $tag['term_id'];
		$slug = get_tag( $tag_id )->slug;
		wp_set_post_tags( $post_id, $slug );

		$q3 = get_posts( array( 'tag__in' => array( $tag_id ) ) );
		$this->assertNotEmpty( $q3 );
		$q4 = get_posts( array( 'tag__in' => array() ) );
		$this->assertNotEmpty( $q4 );

		$q5 = get_posts( array( 'tag_slug__in' => array( $slug ) ) );
		$this->assertNotEmpty( $q5 );
		$q6 = get_posts( array( 'tag_slug__in' => array() ) );
		$this->assertNotEmpty( $q6 );
	}
}
