<?php

class WP_REST_Template_Parts_Controller_Test extends WP_Test_REST_Controller_Testcase {

	public static function wpSetupBeforeClass() {
		switch_theme( 'tt1-blocks' );
		gutenberg_register_template_post_type();
		gutenberg_register_template_part_post_type();
		gutenberg_register_wp_theme_taxonomy();
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/templates', $routes );
		$this->assertArrayHasKey( '/wp/v2/templates/(?P<id>[|\w-]+)', $routes );

		$this->assertArrayHasKey( '/wp/v2/template-parts', $routes );
		$this->assertArrayHasKey( '/wp/v2/template-parts/(?P<id>[|\w-]+)', $routes );
	}

	public function test_context_param() {
		// TODO: Implement test_context_param() method.
	}

	public function test_get_items() {
		// TODO: Implement test_get_items() method.
	}

	public function test_get_item() {
		// TODO: Implement test_get_item() method.
	}

	public function test_create_item() {
		// TODO: Implement test_create_item() method.
	}

	public function test_update_item() {
		// TODO: Implement test_update_item() method.
	}

	public function test_delete_item() {
		// TODO: Implement test_delete_item() method.
	}

	public function test_prepare_item() {
		// TODO: Implement test_prepare_item() method.
	}

	public function test_get_item_schema() {
		// TODO: Implement test_get_item_schema() method.
	}
}
