<?php

/**
 * A set of unit tests for functions in wp-includes/general-template.php
 *
 * @group template
 * @group document-title
 */
class Tests_General_DocumentTitle extends WP_UnitTestCase {

	public $blog_name;

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
			'post_title'   => 'test_title',
			'post_type'    => 'post',
			'post_date'    => '2015-09-22 18:52:17',
			'category'     => $this->category_id,
		) );

		$this->blog_name = get_option( 'blogname' );

		setup_postdata( get_post( $this->post_id ) );
	}

	function tearDown() {
		wp_reset_postdata();
		parent::tearDown();
	}

	function _add_title_tag_support() {
		add_theme_support( 'title-tag' );
	}

	function test__wp_render_title_tag() {
		$this->go_to( '/' );

		$this->expectOutputString( sprintf( "<title>%s &#8211; %s</title>\n", $this->blog_name, get_option( 'blogdescription' ) ) );
		_wp_render_title_tag();
	}

	function test__wp_render_title_no_theme_support() {
		$this->go_to( '/' );

		remove_theme_support( 'title-tag' );

		$this->expectOutputString( '' );
		_wp_render_title_tag();
	}

	function test_short_circuiting_title() {
		$this->go_to( '/' );

		add_filter( 'pre_get_document_title', array( $this, '_short_circuit_title' ) );

		$this->assertEquals( 'A Wild Title', wp_get_document_title() );
	}

	function _short_circuit_title( $title ) {
		return 'A Wild Title';
	}

	function test_front_page_title() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $this->factory->post->create( array( 'post_title' => 'front-page', 'post_type' => 'page' ) ) );
		add_filter( 'document_title_parts', array( $this, '_front_page_title_parts' ) );

		$this->go_to( '/' );
		$this->assertEquals( sprintf( '%s &#8211; Just another WordPress site', $this->blog_name ), wp_get_document_title() );

		update_option( 'show_on_front', 'posts' );

		$this->go_to( '/' );
		$this->assertEquals( sprintf( '%s &#8211; Just another WordPress site', $this->blog_name ), wp_get_document_title() );
	}

	function _front_page_title_parts( $parts ) {
		$this->assertArrayHasKey( 'title', $parts );
		$this->assertArrayHasKey( 'tagline', $parts );
		$this->assertArrayNotHasKey( 'site', $parts );

		return $parts;
	}

	function test_home_title() {
		$blog_page_id = $this->factory->post->create( array( 'post_title' => 'blog-page', 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $blog_page_id );

		// Show page name on home page if it's not the front page.
		$this->go_to( get_permalink( $blog_page_id ) );
		$this->assertEquals( sprintf( 'blog-page &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_paged_title() {
		$this->go_to( '?page=4' );

		add_filter( 'document_title_parts', array( $this, '_paged_title_parts' ) );

		$this->assertEquals( sprintf( '%s &#8211; Page 4 &#8211; Just another WordPress site', $this->blog_name ), wp_get_document_title() );
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

		$this->assertEquals( sprintf( 'test_title &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function _singular_title_parts( $parts ) {
		$this->assertArrayHasKey( 'site', $parts );
		$this->assertArrayHasKey( 'title', $parts );
		$this->assertArrayNotHasKey( 'tagline', $parts );

		return $parts;
	}

	function test_category_title() {
		$this->go_to( '?cat=' . $this->category_id );

		$this->assertEquals( sprintf( 'test_category &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_search_title() {
		$this->go_to( '?s=test_title' );

		$this->assertEquals( sprintf( 'Search Results for &#8220;test_title&#8221; &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_author_title() {
		$this->go_to( '?author=' . $this->author_id );

		$this->assertEquals( sprintf( 'test_author &#8211; %s', $this->blog_name ), wp_get_document_title() );
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

		$this->assertEquals( sprintf( 'test_cpt &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_year_title() {
		$this->go_to( '?year=2015' );

		$this->assertEquals( sprintf( '2015 &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_month_title() {
		$this->go_to( '?monthnum=09' );

		$this->assertEquals( sprintf( 'September 2015 &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_day_title() {
		$this->go_to( '?day=22' );

		$this->assertEquals( sprintf( 'September 22, 2015 &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_404_title() {
		$this->go_to( '?m=404' );

		$this->assertEquals( sprintf( 'Page not found &#8211; %s', $this->blog_name ), wp_get_document_title() );
	}

	function test_paged_post_title() {
		$this->go_to( '?paged=4&p=' . $this->post_id );

		add_filter( 'title_tag_parts', array( $this, '_paged_post_title_parts' ) );

		$this->assertEquals( sprintf( 'test_title &#8211; Page 4 &#8211; %s', $this->blog_name ), wp_get_document_title() );
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

		$this->assertEquals( sprintf( '%s &#8211; test_title', $this->blog_name ), wp_get_document_title() );
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

		$this->assertEquals( sprintf( 'test_title %%%% %s', $this->blog_name ), wp_get_document_title() );
	}

	function _change_title_separator( $sep ) {
		return '%%';
	}
}
