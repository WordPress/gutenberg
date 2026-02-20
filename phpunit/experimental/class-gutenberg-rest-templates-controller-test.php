<?php
/**
 * Unit tests covering Gutenberg_REST_Templates_Controller_7_0 functionality.
 *
 * @package Gutenberg
 */
class WP_Test_Gutenberg_REST_Templates_Controller extends WP_Test_REST_TestCase {
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	/**
	 * Test that the post_types field is included in the schema.
	 */
	public function test_schema_includes_post_types() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'schema', $data );
		$this->assertArrayHasKey( 'properties', $data['schema'] );
		$this->assertArrayHasKey( 'post_types', $data['schema']['properties'] );
		$this->assertSame( 'array', $data['schema']['properties']['post_types']['type'] );
	}

	/**
	 * Test that custom templates with postTypes defined return post_types in the response.
	 */
	public function test_custom_template_returns_post_types() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );

		// Find the custom-template which has postTypes defined in emptytheme's theme.json.
		$custom_template = null;
		foreach ( $data as $template ) {
			if ( isset( $template['slug'] ) && 'custom-template' === $template['slug'] ) {
				$custom_template = $template;
				break;
			}
		}

		$this->assertNotNull( $custom_template, 'Custom template should exist' );
		$this->assertArrayHasKey( 'post_types', $custom_template );
		$this->assertIsArray( $custom_template['post_types'] );
		$this->assertContains( 'post', $custom_template['post_types'] );
	}

	/**
	 * Test that templates without postTypes return an empty array.
	 */
	public function test_template_without_post_types_returns_empty_array() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Find the index template which doesn't have postTypes defined.
		$index_template = null;
		foreach ( $data as $template ) {
			if ( isset( $template['slug'] ) && 'index' === $template['slug'] ) {
				$index_template = $template;
				break;
			}
		}

		$this->assertNotNull( $index_template, 'Index template should exist' );
		$this->assertArrayHasKey( 'post_types', $index_template );
		$this->assertIsArray( $index_template['post_types'] );
		$this->assertEmpty( $index_template['post_types'] );
	}
}
