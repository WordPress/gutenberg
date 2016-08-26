<?php

/**
 * test wp-includes/template.php
 *
 * @group themes
 */
class Tests_Template extends WP_UnitTestCase {

	protected $hierarchy = array();

	public function tearDown() {
		$this->hierarchy = array();
		parent::tearDown();
	}

	/**
	 * @dataProvider data_template_requests
	 *
	 * @param string $url       Request URL to mock.
	 * @param array  $hierarchy Expected template hierarchy.
	 */
	public function test_template_hierarchy_is_correct( $url, array $hierarchy ) {

		$this->go_to( $url );

		foreach ( self::get_query_template_names() as $type => $condition ) {

			if ( call_user_func( $condition ) ) {
				add_filter( "{$type}_template_hierarchy", array( $this, 'log_template_hierarchy' ) );
				call_user_func( "get_{$type}_template" );
				remove_filter( "{$type}_template_hierarchy", array( $this, 'log_template_hierarchy' ) );
			}

		}

		$this->assertEquals( $hierarchy, $this->hierarchy );
	}

	public function data_template_requests() {
		$post = self::factory()->post->create_and_get( array(
			'post_type' => 'post',
			'post_name' => 'post-name',
		) );
		set_post_format( $post, 'quote' );

		$page = self::factory()->post->create_and_get( array(
			'post_type' => 'page',
			'post_name' => 'page-name',
		) );
		add_post_meta( $page->ID, '_wp_page_template', 'templates/page.php' );

		$data = array();

		// Single post embed
		$data[] = array(
			get_post_embed_url( $post ),
			array(
				'embed-post-quote.php',
				'embed-post.php',
				'embed.php',
				'single-post-post-name.php',
				'single-post.php',
				'single.php',
				'singular.php',
			),
		);

		// Search
		$data[] = array(
			add_query_arg( 's', 'foo', home_url() ),
			array(
				'search.php',
			),
		);

		// Single page
		$data[] = array(
			get_permalink( $page ),
			array(
				'templates/page.php',
				'page-page-name.php',
				"page-{$page->ID}.php",
				'page.php',
				'singular.php',
			),
		);

		// Single post
		$data[] = array(
			get_permalink( $post ),
			array(
				'single-post-post-name.php',
				'single-post.php',
				'single.php',
				'singular.php',
			),
		);

		return $data;
	}

	protected static function get_query_template_names() {
		return array(
			'embed'             => 'is_embed',
			'404'               => 'is_404',
			'search'            => 'is_search',
			'front_page'        => 'is_front_page',
			'home'              => 'is_home',
			'post_type_archive' => 'is_post_type_archive',
			'taxonomy'          => 'is_tax',
			'attachment'        => 'is_attachment',
			'single'            => 'is_single',
			'page'              => 'is_page',
			'singular'          => 'is_singular',
			'category'          => 'is_category',
			'tag'               => 'is_tag',
			'author'            => 'is_author',
			'date'              => 'is_date',
			'archive'           => 'is_archive',
			'paged'             => 'is_paged',
		);
	}

	public function log_template_hierarchy( array $hierarchy ) {
		$this->hierarchy = array_merge( $this->hierarchy, $hierarchy );
		return $hierarchy;
	}

}
