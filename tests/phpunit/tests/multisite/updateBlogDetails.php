<?php

if ( is_multisite() ) :

/**
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Update_Blog_Details extends WP_UnitTestCase {
	/**
	 * If `update_blog_details()` is called with any kind of empty arguments, it
	 * should return false.
	 */
	function test_update_blog_details_with_empty_args() {
		$result = update_blog_details( 1, array() );
		$this->assertFalse( $result );
	}

	/**
	 * If the ID passed is not that of a current site, we should expect false.
	 */
	function test_update_blog_details_invalid_blog_id() {
		$result = update_blog_details( 999, array( 'domain' => 'example.com' ) );
		$this->assertFalse( $result );
	}

	function test_update_blog_details() {
		$blog_id = $this->factory->blog->create();

		$result = update_blog_details( $blog_id, array( 'domain' => 'example.com', 'path' => 'my_path/' ) );

		$this->assertTrue( $result );

		$blog = get_blog_details( $blog_id );

		$this->assertEquals( 'example.com', $blog->domain );
		$this->assertEquals( '/my_path/', $blog->path );
		$this->assertEquals( '0', $blog->spam );
	}

	/**
	 * Test each of the actions that should fire in update_blog_details() depending on
	 * the flag and flag value being set. Each action should fire once and should not
	 * fire if a flag is already set for the given flag value.
	 *
	 * @param string $flag       The name of the flag being set or unset on a site.
	 * @param string $flag_value '0' or '1'. The value of the flag being set.
	 * @param string $action     The hook expected to fire for the flag name and flag combination.
	 *
	 * @dataProvider data_flag_hooks
	 */
	public function test_update_blog_details_flag_action( $flag, $flag_value, $hook ) {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		// Set an initial value of '1' for the flag when '0' is the flag value being tested.
		if ( '0' === $flag_value ) {
			update_blog_details( $blog_id, array( $flag => '1' ) );
		}

		add_action( $hook, array( $this, '_action_counter_cb' ), 10 );

		update_blog_details( $blog_id, array( $flag => $flag_value ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( $flag_value, $blog->{$flag} );

		// The hook attached to this flag should have fired once during update_blog_details().
		$this->assertEquals( 1, $test_action_counter );

		// Update the site to the exact same flag value for this flag.
		update_blog_details( $blog_id, array( $flag => $flag_value ) );

		// The hook attached to this flag should not have fired again.
		$this->assertEquals( 1, $test_action_counter );

		remove_action( $hook, array( $this, '_action_counter_cb' ), 10 );
	}

	public function data_flag_hooks() {
		return array(
			array( 'spam',     '0', 'make_ham_blog' ),
			array( 'spam',     '1', 'make_spam_blog' ),
			array( 'archived', '1', 'archive_blog' ),
			array( 'archived', '0', 'unarchive_blog' ),
			array( 'deleted',  '1', 'make_delete_blog' ),
			array( 'deleted',  '0', 'make_undelete_blog' ),
			array( 'mature',   '1', 'mature_blog' ),
			array( 'mature',   '0', 'unmature_blog' ),
		);
	}

	/**
	 * Provide a counter to determine that hooks are firing when intended.
	 */
	function _action_counter_cb() {
		global $test_action_counter;
		$test_action_counter++;
	}

	/**
	 * When the path for a site is updated with update_blog_details(), the final path
	 * should have a leading and trailing slash.
	 *
	 * @dataProvider data_single_directory_path
	 */
	public function test_update_blog_details_single_directory_path( $path, $expected ) {
		update_blog_details( 1, array( 'path' => $path ) );
		$site = get_blog_details( 1 );

		$this->assertEquals( $expected, $site->path );
	}

	public function data_single_directory_path() {
		return array(
			array( 'my_path',   '/my_path/' ),
			array( 'my_path//', '/my_path/' ),
			array( '//my_path', '/my_path/' ),
			array( 'my_path/',  '/my_path/' ),
			array( '/my_path',  '/my_path/' ),
			array( '/my_path/', '/my_path/' ),

			array( 'multiple/dirs',   '/multiple/dirs/' ),
			array( '/multiple/dirs',  '/multiple/dirs/' ),
			array( 'multiple/dirs/',  '/multiple/dirs/' ),
			array( '/multiple/dirs/', '/multiple/dirs/' ),

			// update_blog_details() does not resolve multiple slashes in the middle of a path string.
			array( 'multiple///dirs', '/multiple///dirs/' ),
		);
	}

}
endif;