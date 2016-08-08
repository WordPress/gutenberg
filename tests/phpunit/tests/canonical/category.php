<?php

/**
 * @group canonical
 */
class Tests_Canonical_Category extends WP_Canonical_UnitTestCase {
	public $structure = '/%category%/%postname%/';

	public static $posts = array();
	public static $cats = array();

	public static function wpSetUpBeforeClass( $factory ) {

		self::$posts[0] = $factory->post->create( array( 'post_name' => 'post0' ) );
		self::$posts[1] = $factory->post->create( array( 'post_name' => 'post1' ) );
		self::$cats[0] = $factory->category->create( array( 'slug' => 'cat0' ) );
		self::$cats[1] = $factory->category->create( array( 'slug' => 'cat1' ) );
		self::$cats[2] = $factory->category->create( array( 'slug' => 'cat2' ) );

		wp_set_post_categories( self::$posts[0], self::$cats[2] );
		wp_set_post_categories( self::$posts[0], self::$cats[0] );
		wp_set_post_categories( self::$posts[1], self::$cats[1] );
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$posts as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		foreach ( self::$cats as $cat ) {
			wp_delete_term( $cat, 'category' );
		}
	}

	/**
	 * @dataProvider data_canonical_category
	 */
	public function test_canonical_category( $test_url, $expected, $ticket = 0, $expected_doing_it_wrong = array() ) {
		$this->assertCanonical( $test_url, $expected, $ticket, $expected_doing_it_wrong );
	}

	public function data_canonical_category() {
		/* Data format:
		 * [0]: Test URL.
		 * [1]: expected results: Any of the following can be used
		 *      array( 'url': expected redirection location, 'qv': expected query vars to be set via the rewrite AND $_GET );
		 *      array( expected query vars to be set, same as 'qv' above )
		 *      (string) expected redirect location
		 * [2]: (optional) The ticket the test refers to, Can be skipped if unknown.
		 * [3]: (optional) Array of class/function names expected to throw `_doing_it_wrong()` notices.
		 */

		return array(
			// Valid category.
			array( '/cat0/post0/', array( 'url' => '/cat0/post0/', 'qv' => array( 'category_name' => 'cat0', 'name' => 'post0', 'page' => '' ) ) ),

			// Category other than the first one will redirect to first "canonical" category.
			array( '/cat2/post0/', array( 'url' => '/cat0/post0/', 'qv' => array( 'category_name' => 'cat0', 'name' => 'post0', 'page' => '' ) ) ),

			// Incorrect category will redirect to correct one.
			array( '/cat1/post0/', array( 'url' => '/cat0/post0/', 'qv' => array( 'category_name' => 'cat0', 'name' => 'post0', 'page' => '' ) ) ),

			// Nonexistent category will redirect to correct one.
			array( '/foo/post0/', array( 'url' => '/cat0/post0/', 'qv' => array( 'category_name' => 'cat0', 'name' => 'post0', 'page' => '' ) ) ),

			// Embed URLs should not redirect to post permalinks.
			array( '/cat0/post0/embed/', array( 'url' => '/cat0/post0/embed/', 'qv' => array( 'category_name' => 'cat0', 'name' => 'post0', 'embed' => 'true' ) ) ),
		);
	}
}
