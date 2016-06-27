<?php

/**
 * @group menu
 */
class Tests_Menu_WpAjaxMenuQuickSeach extends WP_UnitTestCase {

	/**
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
}
