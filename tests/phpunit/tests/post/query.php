<?php

/**
 * @group meta
 */
class Tests_Post_Query extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
	}

	function test_meta_key_or_query() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', rand_str() );
		add_post_meta( $post_id, 'foo', rand_str() );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', 'val2' );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'baz', rand_str() );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'froo', rand_str() );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'tango', 'val2' );
		$post_id6 = $this->factory->post->create();
		add_post_meta( $post_id6, 'bar', 'val1' );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo'
				),
				array(
					'key' => 'bar',
					'value' => 'val2'
				),
				array(
					'key' => 'baz'
				),
				array(
					'key' => 'froo'
				),
				'relation' => 'OR',
			),
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 4, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}

		$post_ids = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id2, $post_id3, $post_id4 ), $post_ids );
	}

	function test_meta_key_and_query() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', rand_str() );
		add_post_meta( $post_id, 'foo', rand_str() );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', 'val2' );
		add_post_meta( $post_id2, 'foo', rand_str() );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'baz', rand_str() );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'froo', rand_str() );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'tango', 'val2' );
		$post_id6 = $this->factory->post->create();
		add_post_meta( $post_id6, 'bar', 'val1' );
		add_post_meta( $post_id6, 'foo', rand_str() );
		$post_id7 = $this->factory->post->create();
		add_post_meta( $post_id7, 'foo', rand_str() );
		add_post_meta( $post_id7, 'froo', rand_str() );
		add_post_meta( $post_id7, 'baz', rand_str() );
		add_post_meta( $post_id7, 'bar', 'val2' );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo'
				),
				array(
					'key' => 'bar',
					'value' => 'val2'
				),
				array(
					'key' => 'baz'
				),
				array(
					'key' => 'froo'
				),
				'relation' => 'AND',
			),
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 1, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}

		$post_ids = wp_list_pluck( $posts, 'ID' );
		$this->assertEquals( array( $post_id7 ), $post_ids );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo'
				),
				array(
					'key' => 'bar',
				),
				'relation' => 'AND',
			),
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 3, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}

		$post_ids = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id2, $post_id6, $post_id7 ), $post_ids );
	}

	/**
	 * @ticket 18158
	 */
	function test_meta_key_not_exists() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', rand_str() );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', rand_str() );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'bar', rand_str() );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'baz', rand_str() );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'foo', rand_str() );

		$query = new WP_Query( array(
			'meta_query' => array(
			array(
				'key' => 'foo',
				'compare' => 'NOT EXISTS',
			),
			),
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 3, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}

		$query = new WP_Query( array(
			'meta_query' => array(
			array(
				'key' => 'foo',
				'compare' => 'NOT EXISTS',
			),
				array(
				'key' => 'bar',
				'compare' => 'NOT EXISTS',
			),
			),
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 1, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}

		$query = new WP_Query( array(
			'meta_query' => array(
			array(
				'key' => 'foo',
				'compare' => 'NOT EXISTS',
			),
				array(
				'key' => 'bar',
				'compare' => 'NOT EXISTS',
			),
				array(
				'key' => 'baz',
				'compare' => 'NOT EXISTS',
			),
			)
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 0, count( $posts ) );
	}

	/**
	 * @ticket 23033
	 */
	function test_meta_query_decimal_results() {
		$post_1 = $this->factory->post->create();
		$post_2 = $this->factory->post->create();
		$post_3 = $this->factory->post->create();
		$post_4 = $this->factory->post->create();

		update_post_meta( $post_1, 'decimal_value', '-0.3' );
		update_post_meta( $post_2, 'decimal_value', '0.23409844' );
		update_post_meta( $post_3, 'decimal_value', '0.3' );
		update_post_meta( $post_4, 'decimal_value', '0.4' );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '.300',
						'compare' => '=',
						'type' => 'DECIMAL(10,2)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_3 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '0.35',
						'compare' => '>',
						'type' => 'DECIMAL(10,2)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_4 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '0.3',
						'compare' => '>=',
						'type' => 'DECIMAL(10,2)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_3, $post_4 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '0',
						'compare' => '<',
						'type' => 'DECIMAL(10,2)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_1 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '0.3',
						'compare' => '<=',
						'type' => 'DECIMAL(10,2)'
					)
				),

		) );
		$this->assertEqualSets( array( $post_1, $post_2, $post_3 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => array( 0.23409845, .31 ),
						'compare' => 'BETWEEN',
						'type' => 'DECIMAL(10, 10)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_3 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => array( 0.23409845, .31 ),
						'compare' => 'NOT BETWEEN',
						'type' => 'DECIMAL(10,10)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_1, $post_2, $post_4 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '.3',
						'compare' => 'LIKE',
						'type' => 'DECIMAL(10,2)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_1, $post_3 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'meta_query' => array(
					array(
						'key' => 'decimal_value',
						'value' => '.3',
						'compare' => 'NOT LIKE',
						'type' => 'DECIMAL(10,2)'
					)
				),
		) );
		$this->assertEqualSets( array( $post_2, $post_4 ), wp_list_pluck( $query->posts, 'ID' ) );

		$query = new WP_Query( array(
			'orderby' => 'meta_value',
			'order' => 'DESC',
			'meta_key' => 'decimal_value',
			'meta_type' => 'DECIMAL(10, 2)'
		) );
		$this->assertEqualSets( array( $post_4, $post_3, $post_2, $post_1 ), wp_list_pluck( $query->posts, 'ID' ) );

	}

	/**
	 * @ticket 20604
	 */
	function test_taxonomy_empty_or() {
		// An empty tax query should return an empty array, not all posts.

		$this->factory->post->create_many( 10 );

		$query = new WP_Query( array(
			'fields'	=> 'ids',
			'tax_query' => array(
			'relation' => 'OR',
			array(
				'taxonomy' => 'post_tag',
				'field' => 'id',
				'terms' => false,
				'operator' => 'IN'
			),
			array(
				'taxonomy' => 'category',
				'field' => 'id',
				'terms' => false,
				'operator' => 'IN'
			)
			)
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 0 , count( $posts ) );
	}

	function test_meta_between_not_between() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'time', 500 );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'time', 1001 );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'time', 0 );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'time', 1 );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'time', 1000 );

		$args = array(
			'meta_key' => 'time',
			'meta_value' => array( 1, 1000 ),
			'meta_type' => 'numeric',
			'meta_compare' => 'NOT BETWEEN'
			);

		$query = new WP_Query( $args );
		$this->assertEquals( 2, count ( $query->posts ) );
		foreach ( $query->posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $query->posts, 'ID' );
		$this->assertEqualSets( array( $post_id2, $post_id3 ), $posts );

		$args = array(
			'meta_key' => 'time',
			'meta_value' => array( 1, 1000 ),
			'meta_type' => 'numeric',
			'meta_compare' => 'BETWEEN'
			);

		$query = new WP_Query( $args );
		$this->assertEquals( 3, count ( $query->posts ) );
		foreach ( $query->posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $query->posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id4, $post_id5 ), $posts );
	}

	/**
	 * @ticket 16829
	 */
	function test_meta_default_compare() {
		// compare should default to IN when meta_value is an array
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', 'bar' );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', 'baz' );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'foo', 'baz' );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'baz', 'bar' );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'foo', rand_str() );

		$posts = get_posts( array(
			'meta_key' => 'foo',
			'meta_value' => array( 'bar', 'baz' )
		) );

		$this->assertEquals( 2, count( $posts ) );
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3 ), $posts );

		$posts = get_posts( array(
			'meta_key' => 'foo',
			'meta_value' => array( 'bar', 'baz' ),
			'meta_compare' => 'IN'
		) );

		$this->assertEquals( 2, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3 ), $posts );
	}

	/**
	 * @ticket 17264
	 */
	function test_duplicate_posts_when_no_key() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'city', 'Lorem' );
		add_post_meta( $post_id, 'address', '123 Lorem St.' );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'city', 'Lorem' );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'city', 'Loren' );

		$args = array(
			'meta_query' => array(
			array(
				'value' => 'lorem',
				'compare' => 'LIKE'
			)
			)
		);

		$posts = get_posts( $args );
		$this->assertEquals( 2, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id2 ), $posts );
	}

	/**
	 * @ticket 15292
	 */
	function test_empty_meta_value() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', '0' );
		add_post_meta( $post_id, 'bar', 0 );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'foo', 1 );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'baz', 0 );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'baz', 0 );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'baz', 0 );
		add_post_meta( $post_id5, 'bar', '0' );
		$post_id6 = $this->factory->post->create();
		add_post_meta( $post_id6, 'baz', 0 );

		$posts = get_posts( array( 'meta_key' => 'foo', 'meta_value' => '0' ) );
		$this->assertEquals( 1, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$this->assertEquals( $post_id, $posts[0]->ID );

		$posts = get_posts( array( 'meta_key' => 'bar', 'meta_value' => '0' ) );
		$this->assertEquals( 2, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id5 ), $posts );

		$posts = get_posts( array( 'meta_key' => 'bar', 'meta_value' => 0 ) );
		$this->assertEquals( 2, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id5 ), $posts );

		$posts = get_posts( array( 'meta_value' => 0 ) );
		$this->assertEquals( 5, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3, $post_id4, $post_id5, $post_id6 ), $posts );

		$posts = get_posts( array( 'meta_value' => '0' ) );
		$this->assertEquals( 5, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3, $post_id4, $post_id5, $post_id6 ), $posts );
	}

	function test_taxonomy_include_children() {
		$cat_a = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'Australia' ) );
		$cat_b = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'Sydney', 'parent' => $cat_a ) );
		$cat_c = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'East Syndney', 'parent' => $cat_b ) );
		$cat_d = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'West Syndney', 'parent' => $cat_b ) );

		$post_a = $this->factory->post->create( array( 'post_category' => array( $cat_a ) ) );
		$post_b = $this->factory->post->create( array( 'post_category' => array( $cat_b ) ) );
		$post_c = $this->factory->post->create( array( 'post_category' => array( $cat_c ) ) );
		$post_d = $this->factory->post->create( array( 'post_category' => array( $cat_d ) ) );

		$posts = get_posts( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_a ),
				)
			)
		) );

		$this->assertEquals( 4 , count( $posts ) );

		$posts = get_posts( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_a ),
					'include_children' => false
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );

		$posts = get_posts( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_b ),
				)
			)
		) );

		$this->assertEquals( 3 , count( $posts ) );

		$posts = get_posts( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_b ),
					'include_children' => false
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );

		$posts = get_posts( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_c ),
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );

		$posts = get_posts( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_c ),
					'include_children' => false
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );
	}

	/**
	 * @ticket 22448
	 */
	function test_the_posts_filter() {
		// Create posts and clear their caches.
		$post_ids = $this->factory->post->create_many( 10 );
		foreach ( $post_ids as $post_id )
			clean_post_cache( $post_id );

		add_filter( 'the_posts', array( $this, 'the_posts_filter' ) );

		$query = new WP_Query( array(
			'post_type' => 'post',
			'posts_per_page' => 5,
		) );

		// Sixth post added in filter
		$this->assertEquals( 6, count( $query->posts ) );
		$this->assertEquals( 6, $query->post_count );

		foreach ( $query->posts as $post ) {

			// posts are WP_Post objects
			$this->assertTrue( is_a( $post, 'WP_Post' ) );

			// filters are raw
			$this->assertEquals( 'raw', $post->filter );

			// custom data added in the_posts filter is preserved
			$this->assertEquals( array( $post->ID, 'custom data' ), $post->custom_data );
		}

		remove_filter( 'the_posts', array( $this, 'the_posts_filter' ) );
	}

	/**
	 * Use with the_posts filter, appends a post and adds some custom data.
	 */
	function the_posts_filter( $posts ) {
		$posts[] = clone $posts[0];

		// Add some custom data to each post.
		foreach ( $posts as $key => $post )
			$posts[ $key ]->custom_data = array( $post->ID, 'custom data' );

		return $posts;
	}

	function test_post__in_ordering() {
		$post_id1 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );
		$post_id2 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );
		$post_id3 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_parent' => $post_id2,
			'menu_order' => rand( 1, 100 )
		) );
		$post_id4 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_parent' => $post_id2,
			'menu_order' => rand( 1, 100 )
		) );
		$post_id5 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );

		$ordered = array( $post_id2, $post_id4, $post_id3, $post_id1, $post_id5 );

		$q = new WP_Query( array(
			'post_type' => 'any',
			'post__in' => $ordered,
			'orderby' => 'post__in'
		) );
		$this->assertEqualSets( $ordered, wp_list_pluck( $q->posts, 'ID' ) );
	}

	function test_post__in_attachment_ordering() {
		$post_id = $this->factory->post->create();
		$att_ids = array();
		$file = DIR_TESTDATA . '/images/canola.jpg';
		$att_ids[1] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[2] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[3] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[4] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[5] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );

		$ordered = array( $att_ids[5], $att_ids[1], $att_ids[4], $att_ids[3], $att_ids[2] );

		$attached = new WP_Query( array(
			'post__in' => $ordered,
			'post_type' => 'attachment',
			'post_parent' => $post_id,
			'post_mime_type' => 'image',
			'post_status' => 'inherit',
			'posts_per_page' => '-1',
			'orderby' => 'post__in'
		) );
		$this->assertEqualSets( $ordered, wp_list_pluck( $attached->posts, 'ID' ) );
	}

	function test_post_status() {
		$statuses1 = get_post_stati();
		$this->assertContains( 'auto-draft', $statuses1 );

		$statuses2 = get_post_stati( array( 'exclude_from_search' => true ) );
		$this->assertContains( 'auto-draft', $statuses2 );

		$statuses3 = get_post_stati( array( 'exclude_from_search' => false ) );
		$this->assertNotContains( 'auto-draft', $statuses3 );

		$q1 = new WP_Query( array( 'post_status' => 'any' ) );
		$this->assertContains( "post_status <> 'auto-draft'", $q1->request );

		$q2 = new WP_Query( array( 'post_status' => 'any, auto-draft' ) );
		$this->assertNotContains( "post_status <> 'auto-draft'", $q2->request );

		$q3 = new WP_Query( array( 'post_status' => array( 'any', 'auto-draft' ) ) );
		$this->assertNotContains( "post_status <> 'auto-draft'", $q3->request );
	}
}