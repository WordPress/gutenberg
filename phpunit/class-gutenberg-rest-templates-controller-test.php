<?php
/**
 * Unit tests covering Gutenberg_REST_Templates_Controller_6_7 functionality.
 */
class Gutenberg_REST_Templates_Controller_6_7_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$template_name = 'test-plugin//test-template';
		$args          = array(
			'content'     => 'Template content',
			'title'       => 'Test Template',
			'description' => 'Description of test template',
			'post_types'  => array( 'post', 'page' ),
		);

		wp_register_block_template( $template_name, $args );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/test-plugin//test-template' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotWPError( $response, "Fetching a registered template shouldn't cause an error." );

		$data = $response->get_data();

		$this->assertSame( 'default//test-template', $data['id'], 'Template ID mismatch.' );
		$this->assertSame( 'default', $data['theme'], 'Template theme mismatch.' );
		$this->assertSame( 'Template content', $data['content']['raw'], 'Template content mismatch.' );
		$this->assertSame( 'test-template', $data['slug'], 'Template slug mismatch.' );
		$this->assertSame( 'plugin', $data['source'], "Template source should be 'plugin'." );
		$this->assertSame( 'plugin', $data['origin'], "Template origin should be 'plugin'." );
		$this->assertSame( 'test-plugin', $data['author_text'], 'Template author text mismatch.' );
		$this->assertSame( 'Description of test template', $data['description'], 'Template description mismatch.' );
		$this->assertSame( 'Test Template', $data['title']['rendered'], 'Template title mismatch.' );
		$this->assertSame( 'test-plugin', $data['plugin'], 'Plugin name mismatch.' );

		wp_unregister_block_template( $template_name );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/test-plugin//test-template' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotWPError( $response, "Fetching an unregistered template shouldn't cause an error." );
		$this->assertSame( 404, $response->get_status(), 'Fetching an unregistered template should return 404.' );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}
}
