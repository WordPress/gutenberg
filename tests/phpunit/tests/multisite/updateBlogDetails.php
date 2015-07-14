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

	function test_update_blog_details_make_ham_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'spam' => 1 ) );

		add_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'spam' => 0 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'spam' stays the same.
		update_blog_details( $blog_id, array( 'spam' => 0 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_make_spam_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'spam' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'spam' stays the same.
		update_blog_details( $blog_id, array( 'spam' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_archive_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'archived' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'archived' stays the same.
		update_blog_details( $blog_id, array( 'archived' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_unarchive_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'archived' => 1 ) );

		add_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'archived' => 0 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'archived' stays the same.
		update_blog_details( $blog_id, array( 'archived' => 0 ) );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_make_delete_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'deleted' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'deleted' stays the same.
		update_blog_details( $blog_id, array( 'deleted' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_make_undelete_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'deleted' => 1 ) );

		add_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'deleted' => 0 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'deleted' stays the same.
		update_blog_details( $blog_id, array( 'deleted' => 0 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_mature_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'mature' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'mature' stays the same.
		update_blog_details( $blog_id, array( 'mature' => 1 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_details_unmature_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'mature' => 1 ) );

		add_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_details( $blog_id, array( 'mature' => 0 ) );

		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( 1, $test_action_counter );

		// The action should not fire if the status of 'mature' stays the same.
		update_blog_details( $blog_id, array( 'mature' => 0 ) );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( 1, $test_action_counter );

		remove_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10 );
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