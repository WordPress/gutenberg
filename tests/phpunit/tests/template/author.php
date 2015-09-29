<?php

/**
 * A set of unit tests for functions in wp-includes/author-template.php
 *
 * @group template
 */
class Tests_Author_Template extends WP_UnitTestCase {

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

		// Cleanup.
		$wp_rewrite->set_permalink_structure( '' );
		unset( $GLOBALS['authordata'] );
	}
}
