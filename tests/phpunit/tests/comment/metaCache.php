<?php

class Tests_Comment_Meta_Cache extends WP_UnitTestCase {
	protected $i = 0;
	protected $queries = 0;

	/**
	 * @ticket 16894
	 */
	public function test_update_comment_meta_cache_should_default_to_true() {
		global $wpdb;

		$p = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$comment_ids = self::factory()->comment->create_post_comments( $p, 3 );

		foreach ( $comment_ids as $cid ) {
			update_comment_meta( $cid, 'foo', 'bar' );
		}

		// Clear comment cache, just in case.
		clean_comment_cache( $comment_ids );

		$q = new WP_Comment_Query( array(
			'post_ID' => $p,
		) );

		$num_queries = $wpdb->num_queries;
		foreach ( $comment_ids as $cid ) {
			get_comment_meta( $cid, 'foo', 'bar' );
		}

		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 16894
	 */
	public function test_update_comment_meta_cache_true() {
		global $wpdb;

		$p = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$comment_ids = self::factory()->comment->create_post_comments( $p, 3 );

		foreach ( $comment_ids as $cid ) {
			update_comment_meta( $cid, 'foo', 'bar' );
		}

		// Clear comment cache, just in case.
		clean_comment_cache( $comment_ids );

		$q = new WP_Comment_Query( array(
			'post_ID' => $p,
			'update_comment_meta_cache' => true,
		) );

		$num_queries = $wpdb->num_queries;
		foreach ( $comment_ids as $cid ) {
			get_comment_meta( $cid, 'foo', 'bar' );
		}

		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 16894
	 */
	public function test_update_comment_meta_cache_false() {
		global $wpdb;

		$p = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$comment_ids = self::factory()->comment->create_post_comments( $p, 3 );

		foreach ( $comment_ids as $cid ) {
			update_comment_meta( $cid, 'foo', 'bar' );
		}

		$q = new WP_Comment_Query( array(
			'post_ID' => $p,
			'update_comment_meta_cache' => false,
		) );

		$num_queries = $wpdb->num_queries;
		foreach ( $comment_ids as $cid ) {
			get_comment_meta( $cid, 'foo', 'bar' );
		}

		$this->assertSame( $num_queries + 3, $wpdb->num_queries );
	}

	/**
	 * @ticket 16894
	 */
	public function test_comment_meta_should_be_lazy_loaded_for_all_comments_in_comments_template() {
		global $wpdb;

		$p = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$comment_ids = self::factory()->comment->create_post_comments( $p, 3 );

		foreach ( $comment_ids as $cid ) {
			update_comment_meta( $cid, 'sauce', 'fire' );
		}

		$this->go_to( get_permalink( $p ) );

		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();

				// Load comments with `comments_template()`.
				$cform = get_echo( 'comments_template' );

				// First request will hit the database.
				$num_queries = $wpdb->num_queries;
				get_comment_meta( $comment_ids[0], 'sauce' );
				$this->assertSame( $num_queries + 1, $wpdb->num_queries );

				// Second and third requests should be in cache.
				get_comment_meta( $comment_ids[1], 'sauce' );
				get_comment_meta( $comment_ids[2], 'sauce' );
				$this->assertSame( $num_queries + 1, $wpdb->num_queries );
			}
		}
	}

	/**
	 * @ticket 34047
	 */
	public function test_comment_meta_should_be_lazy_loaded_in_comment_feed_queries() {
		global $wpdb;

		$posts = self::factory()->post->create_many( 2, array( 'post_status' => 'publish' ) );

		$now = time();
		$comments = array();
		for ( $i = 0; $i < 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $posts[0],
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - ( 60 * $i ) ),
			) );
		}

		foreach ( $comments as $c ) {
			add_comment_meta( $c, 'foo', 'bar' );
		}

		update_option( 'posts_per_rss', 3 );

		$q = new WP_Query( array(
			'feed' => true,
			'withcomments' => true,
		) );

		// First comment will cause the cache to be primed.
		$num_queries = $wpdb->num_queries;
		$this->assertSame( 'bar', get_comment_meta( $comments[0], 'foo', 'bar' ) );
		$num_queries++;
		$this->assertSame( $num_queries, $wpdb->num_queries );

		// Second comment from the results should not cause more queries.
		$this->assertSame( 'bar', get_comment_meta( $comments[1], 'foo', 'bar' ) );
		$this->assertSame( $num_queries, $wpdb->num_queries );

		// A comment from outside the results will not be primed.
		$this->assertSame( 'bar', get_comment_meta( $comments[4], 'foo', 'bar' ) );
		$num_queries++;
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 34047
	 */
	public function test_comment_meta_should_be_lazy_loaded_in_single_post_comment_feed_queries() {
		global $wpdb;

		$posts = self::factory()->post->create_many( 2, array( 'post_status' => 'publish' ) );

		$now = time();
		$comments = array();
		for ( $i = 0; $i < 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $posts[0],
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - ( 60 * $i ) ),
			) );
		}

		foreach ( $comments as $c ) {
			add_comment_meta( $c, 'foo', 'bar' );
		}

		update_option( 'posts_per_rss', 3 );

		$q = new WP_Query( array(
			'feed' => true,
			'withcomments' => true,
			'p' => $posts[0],
		) );

		// First comment will cause the cache to be primed.
		$num_queries = $wpdb->num_queries;
		$this->assertSame( 'bar', get_comment_meta( $comments[0], 'foo', 'bar' ) );
		$num_queries++;
		$this->assertSame( $num_queries, $wpdb->num_queries );

		// Second comment from the results should not cause more queries.
		$this->assertSame( 'bar', get_comment_meta( $comments[1], 'foo', 'bar' ) );
		$this->assertSame( $num_queries, $wpdb->num_queries );

		// A comment from outside the results will not be primed.
		$this->assertSame( 'bar', get_comment_meta( $comments[4], 'foo', 'bar' ) );
		$num_queries++;
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}
}
