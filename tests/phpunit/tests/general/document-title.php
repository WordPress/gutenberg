<?php

/**
 * A set of unit tests for functions in wp-includes/general-template.php
 *
 * @group template
 * @group document-title
 */
class Tests_Document_Title extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();

		add_action( 'after_setup_theme', array( $this, '_add_title_tag_support' ) );

		$this->category_id = $this->factory->category->create( array(
			'name' => 'test_category',
		) );

		$this->author_id = $this->factory->user->create( array(
			'role'        => 'author',
			'user_login'  => 'test_author',
			'description' => 'test_author',
		) );

		$this->post_id = $this->factory->post->create( array(
			'post_author'  => $this->author_id,
			'post_status'  => 'publish',
			'post_content' => rand_str(),
			'post_title'   => 'test_title',
			'post_type'    => 'post',
			'post_date'    => '2015-09-22 18:52:17',
			'category'     => $this->category_id,
		) );

		setup_postdata( get_post( $this->post_id ) );
	}

	function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
	}

	function _add_title_tag_support() {
		add_theme_support( 'title-tag' );
	}

	function test_short_circuiting_title() {
		$this->go_to( '/' );

		add_filter( 'pre_get_document_title', array( $this, '_short_circuit_title' ) );

		$this->expectOutputString( "<title>A Wild Title</title>\n" );
		_wp_render_title_tag();
	}

	function _short_circuit_title( $title ) {
		return 'A Wild Title';
	}

	function test_front_page_title() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $this->factory->post->create( array( 'post_title' => 'blog-page', 'post_type' => 'page' ) ) );
		update_option( 'page_on_front', $this->factory->post->create( array( 'post_title' => 'front-page', 'post_type' => 'page' ) ) );

		$this->go_to( '/' );

		$this->expectOutputString( "<title>front-page &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();

		update_option( 'show_on_front', 'posts' );
	}

	function test_home_title() {
		$this->go_to( '/' );

		add_filter( 'document_title_parts', array( $this, '_home_title_parts' ) );

		$this->expectOutputString( "<title>Test Blog &#8211; Just another WordPress site</title>\n" );
		_wp_render_title_tag();
	}

	function _home_title_parts( $parts ) {
		$this->assertArrayHasKey( 'title', $parts );
		$this->assertArrayHasKey( 'tagline', $parts );
		$this->assertArrayNotHasKey( 'site', $parts );

		return $parts;
	}

	function test_paged_title() {
		$this->go_to( '?page=4' );

		add_filter( 'document_title_parts', array( $this, '_paged_title_parts' ) );

		$this->expectOutputString( "<title>Test Blog &#8211; Page 4 &#8211; Just another WordPress site</title>\n" );
		_wp_render_title_tag();
	}

	function _paged_title_parts( $parts ) {
		$this->assertArrayHasKey( 'page', $parts );
		$this->assertArrayHasKey( 'title', $parts );
		$this->assertArrayHasKey( 'tagline', $parts );
		$this->assertArrayNotHasKey( 'site', $parts );

		return $parts;
	}

	function test_singular_title() {
		$this->go_to( '?p=' . $this->post_id );

		add_filter( 'document_title_parts', array( $this, '_singular_title_parts' ) );

		$this->expectOutputString( "<title>test_title &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function _singular_title_parts( $parts ) {
		$this->assertArrayHasKey( 'site', $parts );
		$this->assertArrayHasKey( 'title', $parts );
		$this->assertArrayNotHasKey( 'tagline', $parts );

		return $parts;
	}

	function test_category_title() {
		$this->go_to( '?cat=' . $this->category_id );

		$this->expectOutputString( "<title>test_category &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_search_title() {
		$this->go_to( '?s=test_title' );

		$this->expectOutputString( "<title>Search Results for &#8220;test_title&#8221; &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_author_title() {
		$this->go_to( '?author=' . $this->author_id );

		$this->expectOutputString( "<title>test_author &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_post_type_archive_title() {
		register_post_type( 'cpt', array(
			'public'      => true,
			'has_archive' => true,
			'labels'      => array(
				'name' => 'test_cpt',
			),
		) );

		$this->factory->post->create( array(
			'post_type' => 'cpt',
		) );

		$this->go_to( '?post_type=cpt' );

		$this->expectOutputString( "<title>test_cpt &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_year_title() {
		$this->go_to( '?year=2015' );

		$this->expectOutputString( "<title>2015 &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_month_title() {
		$this->go_to( '?monthnum=09' );

		$this->expectOutputString( "<title>September 2015 &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_day_title() {
		$this->go_to( '?day=22' );

		$this->expectOutputString( "<title>September 22, 2015 &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_404_title() {
		$this->go_to( '?m=404' );

		$this->expectOutputString( "<title>Page not found &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function test_paged_post_title() {
		$this->go_to( '?paged=4&p=' . $this->post_id );

		add_filter( 'title_tag_parts', array( $this, '_paged_post_title_parts' ) );

		$this->expectOutputString( "<title>test_title &#8211; Page 4 &#8211; Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function _paged_post_title_parts( $parts ) {
		$this->assertArrayHasKey( 'page', $parts );
		$this->assertArrayHasKey( 'site', $parts );
		$this->assertArrayHasKey( 'title', $parts );
		$this->assertArrayNotHasKey( 'tagline', $parts );

		return $parts;
	}

	function test_rearrange_title_parts() {
		$this->go_to( '?p=' . $this->post_id );

		add_filter( 'document_title_parts', array( $this, '_rearrange_title_parts' ) );

		$this->expectOutputString( "<title>Test Blog &#8211; test_title</title>\n" );
		_wp_render_title_tag();
	}

	function _rearrange_title_parts( $parts ) {
		$parts = array(
			$parts['site'],
			$parts['title'],
		);

		return $parts;
	}

	function test_change_title_separator() {
		$this->go_to( '?p=' . $this->post_id );

		add_filter( 'document_title_separator', array( $this, '_change_title_separator' ) );

		$this->expectOutputString( "<title>test_title %% Test Blog</title>\n" );
		_wp_render_title_tag();
	}

	function _change_title_separator( $sep ) {
		return '%%';
	}
}
