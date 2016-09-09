<?php

/**
 * @group menu
 */
class Tests_Menu_WpAjaxMenuQuickSeach extends WP_UnitTestCase {

	/**
	 * Current screen.
	 *
	 * @var mixed
	 */
	protected $current_screen;

	/**
	 * Set up. Workaround set_current_screen( null ) not working due to $hook_suffix not being set.
	 */
	function setUp() {
		global $current_screen;
		$this->current_screen = $current_screen;
		parent::setUp();
	}

	/**
	 * Tear down. Workaround set_current_screen( null ) not working due to $hook_suffix not being set.
	 */
	function tearDown() {
		global $current_screen;
		parent::tearDown();
		$current_screen = $this->current_screen;
	}

	/**
	 * Test search returns results for pages.
	 *
	 * @ticket 27042
	 */
	public function test_search_returns_results_for_pages() {
		include_once ABSPATH . 'wp-admin/includes/nav-menu.php';

		self::factory()->post->create_many( 3, array( 'post_type' => 'page', 'post_content' => 'foo' ) );
		self::factory()->post->create( array( 'post_type' => 'page', 'post_content' => 'bar' ) );

		$request = array(
			'type'            => 'quick-search-posttype-page',
			'q'               => 'foo',
			'response-format' => 'json',
		);

		$output = get_echo( '_wp_ajax_menu_quick_search', array( $request ) );
		$this->assertNotEmpty( $output );

		$results = explode( "\n", trim( $output ) );
		$this->assertCount( 3, $results );
	}

	/**
	 * Test that search only returns results for publihed posts.
	 *
	 * @ticket 33742
	 */
	public function test_search_returns_results_for_published_posts() {
		require_once ABSPATH . 'wp-admin/includes/nav-menu.php';

		// This will make sure that WP_Query sets is_admin to true.
		set_current_screen( 'nav-menu.php' );

		self::factory()->post->create( array( 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => 'Publish', 'post_content' => 'FOO' ) );
		self::factory()->post->create( array( 'post_type' => 'post', 'post_status' => 'draft', 'post_title' => 'Draft', 'post_content' => 'FOO' ) );
		self::factory()->post->create( array( 'post_type' => 'post', 'post_status' => 'pending', 'post_title' => 'Pending', 'post_content' => 'FOO' ) );
		self::factory()->post->create( array( 'post_type' => 'post', 'post_status' => 'future', 'post_title' => 'Future', 'post_content' => 'FOO', 'post_date' => gmdate( 'Y-m-d H:i:s', strtotime( '+1 month' ) ) ) );

		$request = array(
			'type' => 'quick-search-posttype-post',
			'q' => 'FOO',
		);
		$output = get_echo( '_wp_ajax_menu_quick_search', array( $request ) );

		$this->assertNotEmpty( $output );
		$results = explode( "\n", trim( $output ) );
		$this->assertCount( 1, $results );
	}
}
