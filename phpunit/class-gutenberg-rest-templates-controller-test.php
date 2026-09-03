<?php
/**
 * Unit tests covering the templates controller with Gutenberg additions.
 *
 * Copied from WP core's Tests_REST_WpRestTemplatesController with
 * modifications to test the `date` field added by Gutenberg.
 *
 * @package gutenberg
 *
 * @group rest-api
 */
class Gutenberg_REST_Templates_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;
	private static $template_post;

	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		// Set up template post.
		$args                = array(
			'post_type'    => 'wp_template',
			'post_name'    => 'my_template',
			'post_title'   => 'My Template',
			'post_content' => 'Content',
			'post_excerpt' => 'Description of my template.',
			'tax_input'    => array(
				'wp_theme' => array(
					get_stylesheet(),
				),
			),
		);
		self::$template_post = self::factory()->post->create_and_get( $args );
		wp_set_post_terms( self::$template_post->ID, get_stylesheet(), 'wp_theme' );
	}

	public function tear_down() {
		if ( has_filter( 'rest_pre_insert_wp_template_part', 'inject_ignored_hooked_blocks_metadata_attributes' ) ) {
			remove_filter( 'rest_pre_insert_wp_template_part', 'inject_ignored_hooked_blocks_metadata_attributes' );
		}
		if ( WP_Block_Type_Registry::get_instance()->is_registered( 'tests/hooked-block' ) ) {
			unregister_block_type( 'tests/hooked-block' );
		}

		parent::tear_down();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$template_post->ID );
	}

	protected function find_and_normalize_template_by_id( $templates, $id ) {
		foreach ( $templates as $template ) {
			if ( $template['id'] === $id ) {
				unset( $template['content'] );
				unset( $template['_links'] );
				return $template;
			}
		}

		return null;
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// Not testing route registration.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Not testing context params.
	}

	/**
	 * @covers WP_REST_Templates_Controller::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/default//my_template' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['content'] );
		unset( $data['_links'] );

		$this->assertSame(
			array(
				'id'              => 'default//my_template',
				'theme'           => 'default',
				'slug'            => 'my_template',
				'source'          => 'custom',
				'origin'          => null,
				'type'            => 'wp_template',
				'description'     => 'Description of my template.',
				'title'           => array(
					'raw'      => 'My Template',
					'rendered' => 'My Template',
				),
				'status'          => 'publish',
				'wp_id'           => self::$template_post->ID,
				'has_theme_file'  => false,
				'is_custom'       => true,
				'author'          => 0,
				'modified'        => mysql_to_rfc3339( self::$template_post->post_modified ),
				'author_text'     => 'Test Blog',
				'original_source' => 'site',
				'date'            => mysql_to_rfc3339( self::$template_post->post_date ),
			),
			$data
		);
	}

	/**
	 * @covers WP_REST_Templates_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame(
			array(
				'id'              => 'default//my_template',
				'theme'           => 'default',
				'slug'            => 'my_template',
				'source'          => 'custom',
				'origin'          => null,
				'type'            => 'wp_template',
				'description'     => 'Description of my template.',
				'title'           => array(
					'raw'      => 'My Template',
					'rendered' => 'My Template',
				),
				'status'          => 'publish',
				'wp_id'           => self::$template_post->ID,
				'has_theme_file'  => false,
				'is_custom'       => true,
				'author'          => 0,
				'modified'        => mysql_to_rfc3339( self::$template_post->post_modified ),
				'author_text'     => 'Test Blog',
				'original_source' => 'site',
				'date'            => mysql_to_rfc3339( self::$template_post->post_date ),
			),
			$this->find_and_normalize_template_by_id( $data, 'default//my_template' )
		);
	}

	/**
	 * A file-backed template has no modification date, which should be exposed as
	 * `null` rather than the `false` returned by `mysql_to_rfc3339()`.
	 *
	 * @ticket 65728
	 * @covers WP_REST_Templates_Controller::prepare_item_for_response
	 */
	public function test_get_item_modified_is_null_for_file_backed_template() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/block-theme//page-home' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'Fetching a file-backed template should return 200.' );
		$this->assertNull( $data['modified'], 'The modified date should be null for a file-backed template.' );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Not testing item creation.
	}

	/**
	 * Reverting a template to its theme version must be refused when neither
	 * the active theme nor a plugin provides the template, since deleting the
	 * database copy would destroy the only version.
	 *
	 * @covers Gutenberg_REST_Templates_Controller_7_2::update_item
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'db-only-template',
				'post_title'   => 'Database-only template',
				'post_content' => '<!-- wp:paragraph --><p>Custom</p><!-- /wp:paragraph -->',
			)
		);
		wp_set_post_terms( $post_id, get_stylesheet(), 'wp_theme' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/' . get_stylesheet() . '//db-only-template' );
		$request->set_body_params( array( 'source' => 'theme' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_template', $response, 400 );
		$this->assertInstanceOf( 'WP_Post', get_post( $post_id ), 'The database copy of the template should not be deleted.' );
	}

	/**
	 * Reverting a customized template to its theme version must still work
	 * when the active theme provides the template.
	 *
	 * @covers Gutenberg_REST_Templates_Controller_7_2::update_item
	 */
	public function test_update_item_reverts_to_theme_when_theme_file_exists() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );

		// Customizing the theme's template creates a database copy of it.
		$customize = new WP_REST_Request( 'PUT', '/wp/v2/templates/block-theme//page-home' );
		$customize->set_body_params( array( 'content' => '<!-- wp:paragraph --><p>Customized</p><!-- /wp:paragraph -->' ) );
		$response = rest_get_server()->dispatch( $customize );
		$this->assertSame( 200, $response->get_status(), 'Customizing a theme template should succeed.' );
		$this->assertSame( 'custom', $response->get_data()['source'], 'The customized template should come from the database.' );

		$revert = new WP_REST_Request( 'PUT', '/wp/v2/templates/block-theme//page-home' );
		$revert->set_body_params( array( 'source' => 'theme' ) );
		$response = rest_get_server()->dispatch( $revert );
		$this->assertSame( 200, $response->get_status(), 'Reverting a customized theme template should succeed.' );
		$this->assertSame( 'theme', $response->get_data()['source'], 'The reverted template should come from the theme file again.' );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Not testing item deletion.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Not testing item preparation.
	}

	/**
	 * A `null` template must produce an error response, not a fatal error from
	 * reading properties on `null`.
	 *
	 * @covers Gutenberg_REST_Templates_Controller_7_2::prepare_item_for_response
	 */
	public function test_prepare_item_for_response_with_null_template() {
		$controller = new Gutenberg_REST_Templates_Controller_7_2( 'wp_template' );
		$request    = new WP_REST_Request( 'PUT', '/wp/v2/templates/default//does-not-exist' );

		$response = $controller->prepare_item_for_response( null, $request );

		$this->assertWPError( $response, 'A null template should produce a WP_Error, not a fatal error.' );
		$this->assertSame( 'rest_template_not_found', $response->get_error_code() );
	}

	/**
	 * @ticket 54422
	 * @covers WP_REST_Templates_Controller::get_item_schema
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/templates' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertCount( 19, $properties );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'theme', $properties );
		$this->assertArrayHasKey( 'type', $properties );
		$this->assertArrayHasKey( 'source', $properties );
		$this->assertArrayHasKey( 'origin', $properties );
		$this->assertArrayHasKey( 'content', $properties );
		$this->assertArrayHasKey( 'title', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'status', $properties );
		$this->assertArrayHasKey( 'wp_id', $properties );
		$this->assertArrayHasKey( 'has_theme_file', $properties );
		$this->assertArrayHasKey( 'is_custom', $properties );
		$this->assertArrayHasKey( 'author', $properties );
		$this->assertArrayHasKey( 'modified', $properties );
		$this->assertArrayHasKey( 'author_text', $properties );
		$this->assertArrayHasKey( 'original_source', $properties );
		$this->assertArrayHasKey( 'plugin', $properties );
		$this->assertArrayHasKey( 'date', $properties );
	}
}
