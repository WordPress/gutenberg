<?php
/**
 * Tests Canonical redirections.
 *
 * In the process of doing so, it also tests WP, WP_Rewrite and WP_Query, A fail here may show a bug in any one of these areas.
 *
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical extends WP_UnitTestCase {

	// This can be defined in a subclass of this class which contains it's own data() method, those tests will be run against the specified permastruct
	var $structure = '/%year%/%monthnum%/%day%/%postname%/';

	var $old_current_user;
	var $author_id;
	var $post_ids;
	var $term_ids;

	function setUp() {
		global $wp_rewrite;

		parent::setUp();

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 5 );
		update_option( 'posts_per_page', 5 );

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( $this->structure );

		create_initial_taxonomies();

		$wp_rewrite->flush_rules();

		$this->old_current_user = get_current_user_id();
		$this->author_id = $this->factory->user->create( array( 'user_login' => 'canonical-author' ) );
		wp_set_current_user( $this->author_id );

		// Already created by install defaults:
		// $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'uncategorized' ) );

		$this->term_ids = array();

		$this->factory->post->create( array( 'import_id' => 587, 'post_title' => 'post-format-test-audio', 'post_date' => '2008-06-02 00:00:00' ) );
		$post_id = $this->factory->post->create( array( 'post_title' => 'post-format-test-gallery', 'post_date' => '2008-06-10 00:00:00' ) );
		$this->factory->post->create( array( 'import_id' => 611, 'post_type' => 'attachment', 'post_title' => 'canola2', 'post_parent' => $post_id ) );

		$this->factory->post->create( array(
			'post_title' => 'images-test',
			'post_date' => '2008-09-03 00:00:00',
			'post_content' => 'Page 1 <!--nextpage--> Page 2 <!--nextpage--> Page 3'
		) );

		$post_id = $this->factory->post->create( array( 'import_id' => 149, 'post_title' => 'comment-test', 'post_date' => '2008-03-03 00:00:00' ) );
		$this->factory->comment->create_post_comments( $post_id, 15 );

		$this->factory->post->create( array( 'post_date' => '2008-09-05 00:00:00' ) );

		$this->factory->post->create( array( 'import_id' => 123 ) );
		$this->factory->post->create( array( 'import_id' => 1 ) );
		$this->factory->post->create( array( 'import_id' => 358 ) );

		$this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'sample-page' ) );
		$this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'about' ) );
		$post_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$this->factory->post->create(
			array( 'import_id' => 144, 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $post_id,
		) );

		$this->term_ids['/category/parent/'] = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'parent' ) );
		$this->term_ids['/category/parent/child-1/'] = $this->factory->term->create( array(
			'taxonomy' => 'category', 'name' => 'child-1', 'parent' => $this->term_ids['/category/parent/'],
		) );
		$this->term_ids['/category/parent/child-1/child-2/'] = $this->factory->term->create( array(
			'taxonomy' => 'category', 'name' => 'child-2', 'parent' => $this->term_ids['/category/parent/child-1/'],
		) );

		$this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-a' ) );
		$this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-b' ) );

		$this->factory->term->create( array( 'name' => 'post-formats' ) );
	}

	function tearDown() {
		global $wp_rewrite;
		parent::tearDown();
		wp_set_current_user( $this->old_current_user );

		$wp_rewrite->init();
	}

	// URL's are relative to the site "front", ie. /category/uncategorized/ instead of http://site.../category..
	// Return url's are full url's with the prepended home.
	function get_canonical($test_url) {
		$test_url = home_url( $test_url );

		$can_url = redirect_canonical( $test_url, false );
		if ( ! $can_url )
			return $test_url; // No redirect will take place for this request

		return $can_url;
	}

	/**
	 * @dataProvider data
	 */
	function test($test_url, $expected, $ticket = 0) {
		if ( $ticket )
			$this->knownWPBug( $ticket );

		$ticket_ref = ($ticket > 0) ? 'Ticket #' . $ticket : null;

		if ( is_string($expected) )
			$expected = array('url' => $expected);
		elseif ( is_array($expected) && !isset($expected['url']) && !isset($expected['qv']) )
			$expected = array( 'qv' => $expected );

		if ( !isset($expected['url']) && !isset($expected['qv']) )
			$this->markTestSkipped('No valid expected output was provided');

		if ( false !== strpos( $test_url, '%d' ) ) {
			if ( false !== strpos( $test_url, '/?author=%d' ) )
				$test_url = sprintf( $test_url, $this->author_id );
			if ( false !== strpos( $test_url, '?cat=%d' ) )
				$test_url = sprintf( $test_url, $this->term_ids[ $expected['url'] ] );
		}

		$this->go_to( home_url( $test_url ) );

		// Does the redirect match what's expected?
		$can_url = $this->get_canonical( $test_url );
		$parsed_can_url = parse_url($can_url);

		// Just test the Path and Query if present
		if ( isset($expected['url']) )
			$this->assertEquals( $expected['url'], $parsed_can_url['path'] . (!empty($parsed_can_url['query']) ? '?' . $parsed_can_url['query'] : ''), $ticket_ref );

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

	function data() {
		/* Data format:
		 * [0]: $test_url,
		 * [1]: expected results: Any of the following can be used
		 *      array( 'url': expected redirection location, 'qv': expected query vars to be set via the rewrite AND $_GET );
		 *      array( expected query vars to be set, same as 'qv' above )
		 *      (string) expected redirect location
		 * [2]: (optional) The ticket the test refers to, Can be skipped if unknown.
		 */

		// Please Note: A few test cases are commented out below, Look at the test case following it, in most cases it's simple showing 2 options for the "proper" redirect.
		return array(
			// Categories

			array( '?cat=%d', '/category/parent/', 15256 ),
			array( '?cat=%d', '/category/parent/child-1/', 15256 ),
			array( '?cat=%d', '/category/parent/child-1/child-2/' ), // no children
			array( '/category/uncategorized/', array( 'url' => '/category/uncategorized/', 'qv' => array( 'category_name' => 'uncategorized' ) ) ),
			array( '/category/uncategorized/page/2/', array( 'url' => '/category/uncategorized/page/2/', 'qv' => array( 'category_name' => 'uncategorized', 'paged' => 2) ) ),
			array( '/category/uncategorized/?paged=2', array( 'url' => '/category/uncategorized/page/2/', 'qv' => array( 'category_name' => 'uncategorized', 'paged' => 2) ) ),
			array( '/category/uncategorized/?paged=2&category_name=uncategorized', array( 'url' => '/category/uncategorized/page/2/', 'qv' => array( 'category_name' => 'uncategorized', 'paged' => 2) ), 17174 ),
			array( '/category/child-1/', '/category/parent/child-1/', 18734 ),
			array( '/category/foo/child-1/', '/category/parent/child-1/', 18734 ),

			// Categories & Intersections with other vars
			array( '/category/uncategorized/?tag=post-formats', array( 'url' => '/category/uncategorized/?tag=post-formats', 'qv' => array('category_name' => 'uncategorized', 'tag' => 'post-formats') ) ),
			array( '/?category_name=cat-a,cat-b', array( 'url' => '/?category_name=cat-a,cat-b', 'qv' => array( 'category_name' => 'cat-a,cat-b' ) ) ),

			// Taxonomies with extra Query Vars
			array( '/category/cat-a/page/1/?test=one%20two', '/category/cat-a/?test=one%20two', 18086), // Extra query vars should stay encoded

			// Categories with Dates
			array( '/category/uncategorized/?paged=2&year=2008', array( 'url' => '/category/uncategorized/page/2/?year=2008', 'qv' => array( 'category_name' => 'uncategorized', 'paged' => 2, 'year' => 2008) ), 17661 ),
//			array( '/2008/04/?cat=1', array( 'url' => '/2008/04/?cat=1', 'qv' => array('cat' => '1', 'year' => '2008', 'monthnum' => '04' ) ), 17661 ),
			array( '/2008/04/?cat=1', array( 'url' => '/category/uncategorized/?year=2008&monthnum=04', 'qv' => array('category_name' => 'uncategorized', 'year' => '2008', 'monthnum' => '04' ) ), 17661 ),
//			array( '/2008/?category_name=cat-a', array( 'url' => '/2008/?category_name=cat-a', 'qv' => array('category_name' => 'cat-a', 'year' => '2008' ) ) ),
			array( '/2008/?category_name=cat-a', array( 'url' => '/category/cat-a/?year=2008', 'qv' => array('category_name' => 'cat-a', 'year' => '2008' ) ), 20386 ),
//			array( '/category/uncategorized/?year=2008', array( 'url' => '/2008/?category_name=uncategorized', 'qv' => array('category_name' => 'uncategorized', 'year' => '2008' ) ), 17661 ),
			array( '/category/uncategorized/?year=2008', array( 'url' => '/category/uncategorized/?year=2008', 'qv' => array('category_name' => 'uncategorized', 'year' => '2008' ) ), 17661 ),

			// Pages
			array( '/sample%20page/', array( 'url' => '/sample-page/', 'qv' => array('pagename' => 'sample-page', 'page' => '' ) ), 17653 ), // Page rules always set 'page'
			array( '/sample------page/', array( 'url' => '/sample-page/', 'qv' => array('pagename' => 'sample-page', 'page' => '' ) ), 14773 ),
			array( '/child-page-1/', '/parent-page/child-page-1/'),
			array( '/?page_id=144', '/parent-page/child-page-1/'),
			array( '/abo', '/about/' ),

			// Posts
			array( '?p=587', '/2008/06/02/post-format-test-audio/'),
			array( '/?name=images-test', '/2008/09/03/images-test/'),
			// Incomplete slug should resolve and remove the ?name= parameter
			array( '/?name=images-te', '/2008/09/03/images-test/', 20374),
			// Page slug should resolve to post slug and remove the ?pagename= parameter
			array( '/?pagename=images-test', '/2008/09/03/images-test/', 20374),

			array( '/2008/06/02/post-format-test-au/', '/2008/06/02/post-format-test-audio/'),
			array( '/2008/06/post-format-test-au/', '/2008/06/02/post-format-test-audio/'),
			array( '/2008/post-format-test-au/', '/2008/06/02/post-format-test-audio/'),
			array( '/2010/post-format-test-au/', '/2008/06/02/post-format-test-audio/'), // A Year the post is not in
			array( '/post-format-test-au/', '/2008/06/02/post-format-test-audio/'),

			array( '/2008/09/03/images-test/3/', array( 'url' => '/2008/09/03/images-test/3/', 'qv' => array( 'name' => 'images-test', 'year' => '2008', 'monthnum' => '09', 'day' => '03', 'page' => '/3' ) ) ), // page = /3 ?!
			array( '/2008/09/03/images-test/8/', '/2008/09/03/images-test/4/', 11694 ), // post with 4 pages
			array( '/2008/09/03/images-test/?page=3', '/2008/09/03/images-test/3/' ),
			array( '/2008/09/03/images-te?page=3', '/2008/09/03/images-test/3/' ),

			// Comments
			array( '/2008/03/03/comment-test/?cpage=2', '/2008/03/03/comment-test/comment-page-2/' ),
			array( '/2008/03/03/comment-test/comment-page-20/', '/2008/03/03/comment-test/comment-page-3/', 20388 ), // there's only 3 pages
			array( '/2008/03/03/comment-test/?cpage=30', '/2008/03/03/comment-test/comment-page-3/', 20388 ), // there's only 3 pages

			// Attachments
			array( '/?attachment_id=611', '/2008/06/10/post-format-test-gallery/canola2/' ),
			array( '/2008/06/10/post-format-test-gallery/?attachment_id=611', '/2008/06/10/post-format-test-gallery/canola2/' ),

			// Dates
			array( '/?m=2008', '/2008/' ),
			array( '/?m=200809', '/2008/09/'),
			array( '/?m=20080905', '/2008/09/05/'),

			array( '/2008/?day=05', '/2008/?day=05'), // no redirect
			array( '/2008/09/?day=05', '/2008/09/05/'),
			array( '/2008/?monthnum=9', '/2008/09/'),

			array( '/?year=2008', '/2008/'),

			array( '/2012/13/', '/2012/'),
			array( '/2012/11/51/', '/2012/11/'),

			// Authors
			array( '/?author=%d', '/author/canonical-author/' ),
//			array( '/?author=%d&year=2008', '/2008/?author=3'),
			array( '/?author=%d&year=2008', '/author/canonical-author/?year=2008', 17661 ),
//			array( '/author/canonical-author/?year=2008', '/2008/?author=3'), //Either or, see previous testcase.
			array( '/author/canonical-author/?year=2008', '/author/canonical-author/?year=2008', 17661 ),

			// Feeds
			array( '/?feed=atom', '/feed/atom/' ),
			array( '/?feed=rss2', '/feed/' ),
			array( '/?feed=comments-rss2', '/comments/feed/'),
			array( '/?feed=comments-atom', '/comments/feed/atom/'),

			// Feeds (per-post)
			array( '/2008/03/03/comment-test/?feed=comments-atom', '/2008/03/03/comment-test/feed/atom/'),
			array( '/?p=149&feed=comments-atom', '/2008/03/03/comment-test/feed/atom/'),
			array( '/2008/03/03/comment-test/?feed=comments-atom', '/2008/03/03/comment-test/feed/atom/' ),

			// Index
			array( '/?paged=1', '/' ),
			array( '/page/1/', '/' ),
			array( '/page1/', '/' ),
			array( '/?paged=2', '/page/2/' ),
			array( '/page2/', '/page/2/' ),

			// Misc
			array( '/2008%20', '/2008' ),
			array( '//2008////', '/2008/' ),

			// Todo: Endpoints (feeds, trackbacks, etc), More fuzzed mixed query variables, comment paging, Home page (Static)
		);
	}
}
