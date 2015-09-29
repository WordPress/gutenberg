<?php

/**
 * A set of unit tests for functions in wp-includes/author-template.php
 *
 * @group template
 */
class Tests_Author_Template extends WP_UnitTestCase {
	private $permalink_structure;

	public function setUp() {
		parent::setUp();

		global $wp_rewrite;
		$this->permalink_structure = get_option( 'permalink_structure' );
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();

	}

	public function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $this->permalink_structure );
		$wp_rewrite->flush_rules();

		parent::tearDown();
	}

	/**
	 * @ticket 30355
	 */
	public function test_get_the_author_posts_link_no_permalinks() {
		$author = $this->factory->user->create_and_get( array(
			'display_name'  => 'Foo',
			'user_nicename' => 'bar'
		) );

		$GLOBALS['authordata'] = $author->data;

		$link = get_the_author_posts_link();

		$url = sprintf( 'http://%1$s/?author=%2$s', WP_TESTS_DOMAIN, $author->ID );

		$this->assertContains( $url, $link );
		$this->assertContains( 'Posts by Foo', $link );
		$this->assertContains( '>Foo</a>', $link );

		unset( $GLOBALS['authordata'] );
	}

	/**
	 * @ticket 30355
	 */
	public function test_get_the_author_posts_link_with_permalinks() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$author = $this->factory->user->create_and_get( array(
			'display_name'  => 'Foo',
			'user_nicename' => 'bar'
		) );

		$GLOBALS['authordata'] = $author;

		$link = get_the_author_posts_link();

		$url = sprintf( 'http://%1$s/author/%2$s/', WP_TESTS_DOMAIN, $author->user_nicename );

		$this->assertContains( $url, $link );
		$this->assertContains( 'Posts by Foo', $link );
		$this->assertContains( '>Foo</a>', $link );

		unset( $GLOBALS['authordata'] );
	}
}
