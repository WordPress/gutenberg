<?php

/**
 * @group themes
 */
class Tests_Theme_Support extends WP_UnitTestCase {

	function test_the_basics() {
		add_theme_support( 'automatic-feed-links' );
		$this->assertTrue( current_theme_supports( 'automatic-feed-links' ) );
		remove_theme_support( 'automatic-feed-links' );
		$this->assertFalse( current_theme_supports( 'automatic-feed-links' ) );
		add_theme_support( 'automatic-feed-links' );
		$this->assertTrue( current_theme_supports( 'automatic-feed-links' ) );
	}

	function test_admin_bar() {
		add_theme_support( 'admin-bar' );
		$this->assertTrue( current_theme_supports( 'admin-bar' ) );
		remove_theme_support( 'admin-bar' );
		$this->assertFalse( current_theme_supports( 'admin-bar' ) );
		add_theme_support( 'admin-bar' );
		$this->assertTrue( current_theme_supports( 'admin-bar' ) );

		add_theme_support( 'admin-bar', array( 'callback' => '__return_false' ) );
		$this->assertTrue( current_theme_supports( 'admin-bar' ) );

		$this->assertEquals(
			array( 0 => array( 'callback' => '__return_false' ) ),
			get_theme_support( 'admin-bar' )
		);
		remove_theme_support( 'admin-bar' );
		$this->assertFalse( current_theme_supports( 'admin-bar' ) );
		$this->assertFalse( get_theme_support( 'admin-bar' ) );
	}

	public function test_post_thumbnails() {
		add_theme_support( 'post-thumbnails' );
		$this->assertTrue( current_theme_supports( 'post-thumbnails' ) );
		remove_theme_support( 'post-thumbnails' );
		$this->assertFalse( current_theme_supports( 'post-thumbnails' ) );
		add_theme_support( 'post-thumbnails' );
		$this->assertTrue( current_theme_supports( 'post-thumbnails' ) );
	}

	public function test_post_thumbnails_flat_array_of_post_types() {
		add_theme_support( 'post-thumbnails', array( 'post', 'page' ) );
		$this->assertTrue( current_theme_supports( 'post-thumbnails' ) );
		$this->assertTrue( current_theme_supports( 'post-thumbnails', 'post' ) );
		$this->assertFalse( current_theme_supports( 'post-thumbnails', 'book' ) );
		remove_theme_support( 'post-thumbnails' );
		$this->assertFalse( current_theme_supports( 'post-thumbnails' ) );
	}

	public function test_post_thumbnails_types_true() {
		// array of arguments, with the key of 'types' holding the post types.
		add_theme_support( 'post-thumbnails', array( 'types' => true ) );
		$this->assertTrue( current_theme_supports( 'post-thumbnails' ) );
		$this->assertTrue( current_theme_supports( 'post-thumbnails', rand_str() ) ); // any type
		remove_theme_support( 'post-thumbnails' );
		$this->assertFalse( current_theme_supports( 'post-thumbnails' ) );
	}

	/**
	 * @ticket 24932
	 */
	function test_supports_html5() {
		remove_theme_support( 'html5' );
		$this->assertFalse( current_theme_supports( 'html5' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'comment-form' ) );
		$this->assertNotSame( false, add_theme_support( 'html5' ) );
		$this->assertTrue( current_theme_supports( 'html5' ) );
		$this->assertTrue( current_theme_supports( 'html5', 'comment-form' ) );
		$this->assertTrue( current_theme_supports( 'html5', 'comment-list' ) );
		$this->assertTrue( current_theme_supports( 'html5', 'search-form' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'something-else' ) );
	}

	/**
	 * @ticket 24932
	 *
	 * @expectedIncorrectUsage add_theme_support( 'html5' )
	 */
	function test_supports_html5_subset() {
		remove_theme_support( 'html5' );
		$this->assertFalse( current_theme_supports( 'html5' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'comment-form' ) );
		$this->assertFalse( add_theme_support( 'html5', 'comment-form' ) );
		$this->assertNotSame( false, add_theme_support( 'html5', array( 'comment-form' ) ) );
		$this->assertTrue( current_theme_supports( 'html5', 'comment-form' ) );

		// This will return true, which might help a plugin author decide what markup to serve,
		// but core should never check for it.
		$this->assertTrue( current_theme_supports( 'html5' ) );

		// It appends, rather than replaces.
		$this->assertFalse( current_theme_supports( 'html5', 'comment-list' ) );
		$this->assertNotSame( false, add_theme_support( 'html5', array( 'comment-list' ) ) );
		$this->assertTrue( current_theme_supports( 'html5', 'comment-form' ) );
		$this->assertTrue( current_theme_supports( 'html5', 'comment-list' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'search-form' ) );

		// Removal is all or nothing.
		$this->assertTrue( remove_theme_support( 'html5' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'comment-list' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'comment-form' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'search-form' ) );
	}

	/**
	 * @ticket 24932
	 *
	 * @expectedIncorrectUsage add_theme_support( 'html5' )
	 */
	function test_supports_html5_invalid() {
		remove_theme_support( 'html5' );
		$this->assertFalse( add_theme_support( 'html5', 'comment-form' ) );
		$this->assertFalse( current_theme_supports( 'html5', 'comment-form' ) );
		$this->assertFalse( current_theme_supports( 'html5' ) );
	}

	function supports_foobar( $yesno, $args, $feature ) {
		if ( $args[0] == $feature[0] )
			return true;
		return false;
	}

	function test_plugin_hook() {
		$this->assertFalse( current_theme_supports( 'foobar' ) );
		add_theme_support( 'foobar' );
		$this->assertTrue( current_theme_supports( 'foobar' ) );

		add_filter( 'current_theme_supports-foobar', array( $this, 'supports_foobar'), 10, 3 );

		add_theme_support( 'foobar', 'bar' );
		$this->assertFalse( current_theme_supports( 'foobar', 'foo' ) );
		$this->assertTrue( current_theme_supports( 'foobar', 'bar' ) );

		remove_theme_support( 'foobar' );
		$this->assertFalse( current_theme_supports( 'foobar', 'bar' ) );
	}

	/**
	 * @ticket 26900
	 */
	function test_supports_menus() {
		// Start fresh
		foreach ( get_registered_nav_menus() as $location => $desc ) {
			unregister_nav_menu( $location );
		}
		_remove_theme_support( 'menus' );
		$this->assertFalse( current_theme_supports( 'menus' ) );

		// Registering a nav menu automatically adds support.
		register_nav_menu( 'primary', 'Primary Navigation' );
		register_nav_menu( 'secondary', 'Secondary Navigation' );
		$this->assertTrue( current_theme_supports( 'menus' ) );

		// Support added internally, can't be removed.
		remove_theme_support( 'menus' );
		$this->assertTrue( current_theme_supports( 'menus' ) );

		// Still supports because of secondary.
		unregister_nav_menu( 'primary' );
		$this->assertTrue( current_theme_supports( 'menus' ) );

		// No longer support because we have no menus.
		unregister_nav_menu( 'secondary' );
		$this->assertEmpty( get_registered_nav_menus() );
		$this->assertFalse( current_theme_supports( 'menus' ) );
	}
}
