<?php

class WP_Canonical_UnitTestCase extends WP_UnitTestCase {
	static $old_current_user;
	static $author_id;
	static $post_ids = array();
	static $comment_ids = array();
	static $term_ids = array();
	static $terms = array();
	static $old_options = array();

	/**
	 * This can be defined in a subclass of this class which contains its own data() method.
	 * Those tests will be run against the specified permastruct.
	 */
	public $structure = '/%year%/%monthnum%/%day%/%postname%/';

	public function setUp() {
		global $wp_rewrite;

		parent::setUp();

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 5 );
		update_option( 'posts_per_page', 5 );

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( $this->structure );
		create_initial_taxonomies();
		$wp_rewrite->flush_rules();
	}

	/**
	 * Generate fixtures to be shared between canonical tests.
	 *
	 * Abstracted here because it's invoked by setUpBeforeClass() in more than one class.
	 *
	 * @since 4.1.0
	 */
	public static function generate_shared_fixtures() {
		global $wp_rewrite;

		$factory = new WP_UnitTest_Factory;

		self::$old_current_user = get_current_user_id();
		self::$author_id = $factory->user->create( array( 'user_login' => 'canonical-author' ) );

		/*
		 * Also set in self::setUp(), but we must configure here to make sure that
		 * post authorship is properly attributed for fixtures.
		 */
		wp_set_current_user( self::$author_id );

		// Already created by install defaults:
		// $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'uncategorized' ) );

		self::$post_ids[] = $factory->post->create( array( 'import_id' => 587, 'post_title' => 'post-format-test-audio', 'post_date' => '2008-06-02 00:00:00' ) );
		self::$post_ids[] = $post_id = $factory->post->create( array( 'post_title' => 'post-format-test-gallery', 'post_date' => '2008-06-10 00:00:00' ) );
		self::$post_ids[] = $factory->post->create( array( 'import_id' => 611, 'post_type' => 'attachment', 'post_title' => 'canola2', 'post_parent' => $post_id ) );

		self::$post_ids[] = $factory->post->create( array(
			'post_title' => 'images-test',
			'post_date' => '2008-09-03 00:00:00',
			'post_content' => 'Page 1 <!--nextpage--> Page 2 <!--nextpage--> Page 3'
		) );

		self::$post_ids[] = $post_id = $factory->post->create( array( 'import_id' => 149, 'post_title' => 'comment-test', 'post_date' => '2008-03-03 00:00:00' ) );
		self::$comment_ids = $factory->comment->create_post_comments( $post_id, 15 );

		self::$post_ids[] = $factory->post->create( array( 'post_date' => '2008-09-05 00:00:00' ) );

		self::$post_ids[] = $factory->post->create( array( 'import_id' => 123 ) );
		self::$post_ids[] = $factory->post->create( array( 'import_id' => 1 ) );
		self::$post_ids[] = $factory->post->create( array( 'import_id' => 358 ) );

		self::$post_ids[] = $factory->post->create( array( 'post_type' => 'page', 'post_title' => 'sample-page' ) );
		self::$post_ids[] = $factory->post->create( array( 'post_type' => 'page', 'post_title' => 'about' ) );
		self::$post_ids[] = $post_id = $factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		self::$post_ids[] = $factory->post->create(
			array( 'import_id' => 144, 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $post_id,
		) );

		$cat1 = $factory->term->create( array( 'taxonomy' => 'category', 'name' => 'parent' ) );
		self::$terms['/category/parent/'] = $cat1;
		self::$term_ids[ $cat1 ] = 'category';

		$cat2 = $factory->term->create( array(
			'taxonomy' => 'category', 'name' => 'child-1', 'parent' => self::$terms['/category/parent/'],
		) );
		self::$terms['/category/parent/child-1/'] = $cat2;
		self::$term_ids[ $cat2 ] = 'category';

		$cat3 = $factory->term->create( array(
			'taxonomy' => 'category', 'name' => 'child-2', 'parent' => self::$terms['/category/parent/child-1/'],
		) );
		self::$terms['/category/parent/child-1/child-2/'] = $cat3;
		self::$term_ids[ $cat3 ] = 'category';

		$cat4 = $factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-a' ) );
		self::$term_ids[ $cat4 ] = 'category';

		$cat5 = $factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-b' ) );
		self::$term_ids[ $cat5 ] = 'category';

		$tag1 = $factory->term->create( array( 'name' => 'post-formats' ) );
		self::$term_ids[ $tag1 ] = 'post_tag';

		self::commit_transaction();
	}

	/**
	 * Clean up shared fixtures.
	 *
	 * @since 4.1.0
	 */
	public static function delete_shared_fixtures() {
		global $wp_rewrite;

		if ( is_multisite() ) {
			wpmu_delete_user( self::$author_id );
		} else {
			wp_delete_user( self::$author_id );
		}

		foreach ( self::$post_ids as $pid ) {
			wp_delete_post( $pid, true );
		}

		foreach ( self::$comment_ids as $cid ) {
			wp_delete_comment( $cid, true );
		}

		foreach ( self::$term_ids as $tid => $tax ) {
			wp_delete_term( $tid, $tax );
		}

		self::$author_id = null;
		self::$post_ids = array();
		self::$comment_ids = array();
		self::$term_ids = array();
		self::$terms = array();

		self::commit_transaction();
	}

	/**
	 * Assert that a given URL is the same a the canonical URL generated by WP.
	 *
	 * @since 4.1.0
	 *
	 * @param string $test_url                Raw URL that will be run through redirect_canonical().
	 * @param string $expected                Expected string.
	 * @param int    $ticket                  Optional. Trac ticket number.
	 * @param array  $expected_doing_it_wrong Array of class/function names expected to throw _doing_it_wrong() notices.
	 */
	public function assertCanonical( $test_url, $expected, $ticket = 0, $expected_doing_it_wrong = array() ) {
		$this->expected_doing_it_wrong = array_merge( $this->expected_doing_it_wrong, (array) $expected_doing_it_wrong );

		if ( $ticket )
			$this->knownWPBug( $ticket );

		$ticket_ref = ($ticket > 0) ? 'Ticket #' . $ticket : null;
global $wpdb;
//print_r( $wpdb->get_results( "SELECT * FROM $wpdb->terms" ) );
		if ( is_string($expected) )
			$expected = array('url' => $expected);
		elseif ( is_array($expected) && !isset($expected['url']) && !isset($expected['qv']) )
			$expected = array( 'qv' => $expected );

		if ( !isset($expected['url']) && !isset($expected['qv']) )
			$this->markTestSkipped('No valid expected output was provided');

		$this->go_to( home_url( $test_url ) );

		// Does the redirect match what's expected?
		$can_url = $this->get_canonical( $test_url );
		$parsed_can_url = parse_url($can_url);

		// Just test the Path and Query if present
		if ( isset($expected['url']) ) {
			$this->assertEquals( $expected['url'], $parsed_can_url['path'] . (!empty($parsed_can_url['query']) ? '?' . $parsed_can_url['query'] : ''), $ticket_ref );
		}

		if ( ! isset($expected['qv']) )
			return;

		// "make" that the request and check the query is correct
		$this->go_to( $can_url );

		// Are all query vars accounted for, And correct?
		global $wp;

		$query_vars = array_diff($wp->query_vars, $wp->extra_query_vars);
		if ( !empty($parsed_can_url['query']) ) {
			parse_str($parsed_can_url['query'], $_qv);

			// $_qv should not contain any elements which are set in $query_vars already (ie. $_GET vars should not be present in the Rewrite)
			$this->assertEquals( array(), array_intersect( $query_vars, $_qv ), 'Query vars are duplicated from the Rewrite into $_GET; ' . $ticket_ref );

			$query_vars = array_merge($query_vars, $_qv);
		}

		$this->assertEquals( $expected['qv'], $query_vars );
	}

	/**
	 * Get the canonical URL given a raw URL.
	 *
	 * @param string $test_url Should be relative to the site "front", ie /category/uncategorized/
	 *                         as opposed to http://example.com/category/uncategorized/
	 * @return $can_url Returns the original $test_url if no canonical can be generated, otherwise returns
	 *                  the fully-qualified URL as generated by redirect_canonical().
	 */
	public function get_canonical( $test_url ) {
		$test_url = home_url( $test_url );

		$can_url = redirect_canonical( $test_url, false );
		if ( ! $can_url )
			return $test_url; // No redirect will take place for this request

		return $can_url;
	}
}
