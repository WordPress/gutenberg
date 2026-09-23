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

		$expected = array(
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
		);
		$actual   = $data;

		// The REST response is a JSON object, so key order is not part of the contract.
		ksort( $expected );
		ksort( $actual );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * @covers WP_REST_Templates_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$expected = array(
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
		);
		$actual   = $this->find_and_normalize_template_by_id( $data, 'default//my_template' );

		// The REST response is a JSON object, so key order is not part of the contract.
		ksort( $expected );
		ksort( $actual );
		$this->assertSame( $expected, $actual );
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

	public function test_post_templates_reject_post_type_with_post_id() {
		wp_set_current_user( self::$admin_id );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		foreach ( array( 'GET', 'HEAD' ) as $method ) {
			foreach ( array( 'page', 'post' ) as $post_type ) {
				$request = new WP_REST_Request( $method, '/wp/v2/templates' );
				$request->set_param( 'post_id', $page_id );
				$request->set_param( 'post_type', $post_type );
				$response = rest_get_server()->dispatch( $request );
				$data     = $response->get_data();

				$this->assertSame( 400, $response->get_status() );
				$this->assertSame( 'rest_invalid_param', $data['code'] );
				$this->assertSame( 'Use either post_id or post_type, not both.', $data['data']['params']['post_id'] );
			}
		}
	}

	public function test_templates_can_be_filtered_by_post_type_without_post_id() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_type', 'page' );
		$response = rest_get_server()->dispatch( $request );
		$ids      = wp_list_pluck( $response->get_data(), 'id' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertContains( 'block-theme//custom-hero-template', $ids );
		$this->assertNotContains( 'block-theme//page', $ids );
	}

	public function test_post_templates_include_the_default_before_filtering() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$seen    = null;
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) use ( &$seen, $page_id ) {
				if ( ( $query['post_id'] ?? null ) === $page_id ) {
					$seen = $templates;
				}
				return $templates;
			},
			10,
			2
		);
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_id', $page_id );
		$response = rest_get_server()->dispatch( $request );
		$ids      = wp_list_pluck( $response->get_data(), 'id' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'block-theme//page', $ids[0] );
		$this->assertSame( 'block-theme//page', $seen[0]->id );
		$this->assertContains( 'block-theme//custom-hero-template', $ids );
		$this->assertSame( $ids, array_values( array_unique( $ids ) ) );
	}

	public function test_filter_can_return_one_non_custom_template_for_one_page() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$page_id       = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$other_page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$template_id   = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'archive-product',
				'post_content' => '<!-- wp:post-content /-->',
			)
		);
		wp_set_post_terms( $template_id, 'block-theme', 'wp_theme' );
		update_post_meta( $template_id, 'is_wp_suggestion', true );
		$catalog = get_block_template( 'block-theme//archive-product' );
		$this->assertFalse( $catalog->is_custom );
		$request   = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$full_list = rest_get_server()->dispatch( $request )->get_data();
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) use ( $page_id, $catalog ) {
				return ( $query['post_id'] ?? null ) === $page_id ? array( $catalog ) : $templates;
			},
			10,
			2
		);

		$request->set_param( 'post_id', $page_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( array( $catalog->id ), wp_list_pluck( $response->get_data(), 'id' ) );
		$request->set_param( 'post_id', $other_page_id );
		$this->assertSame( 'block-theme//page', rest_get_server()->dispatch( $request )->get_data()[0]['id'] );
		$this->assertSame( $full_list, rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/templates' ) )->get_data() );
		$this->assertArrayNotHasKey( 'X-WP-Template-Policy', $response->get_headers() );
	}

	public function test_homepage_returns_only_front_page_when_available() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$page_id     = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$template_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'front-page',
				'post_content' => '<!-- wp:post-content /-->',
			)
		);
		wp_set_post_terms( $template_id, 'block-theme', 'wp_theme' );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_id', $page_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( array( 'block-theme//front-page' ), wp_list_pluck( $response->get_data(), 'id' ) );
	}

	public function test_homepage_without_front_page_retains_normal_choices() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_id', $page_id );
		$ids = wp_list_pluck( rest_get_server()->dispatch( $request )->get_data(), 'id' );
		$this->assertSame( 'block-theme//page', $ids[0] );
		$this->assertContains( 'block-theme//custom-hero-template', $ids );
	}

	public function test_posts_page_uses_home_and_falls_back_to_index() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $page_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_id', $page_id );
		$this->assertSame( array( 'block-theme//index' ), wp_list_pluck( rest_get_server()->dispatch( $request )->get_data(), 'id' ) );
		$template_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'home',
				'post_content' => '<!-- wp:post-content /-->',
			)
		);
		wp_set_post_terms( $template_id, 'block-theme', 'wp_theme' );
		$this->assertSame( array( 'block-theme//home' ), wp_list_pluck( rest_get_server()->dispatch( $request )->get_data(), 'id' ) );
	}

	public function test_post_context_requires_permission_to_edit_that_post() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_id', 999999 );
		$this->assertSame( 404, rest_get_server()->dispatch( $request )->get_status() );
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		$page_id   = self::factory()->post->create( array( 'post_type' => 'page' ) );
		wp_set_current_user( $author_id );
		$request->set_param( 'post_id', $page_id );
		$this->assertSame( 403, rest_get_server()->dispatch( $request )->get_status() );
		$post_id = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$request->set_param( 'post_id', $post_id );
		$this->assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
	}

	public function test_filter_can_remove_all_choices_without_restoring_the_default() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) use ( $page_id ) {
				return ( $query['post_id'] ?? null ) === $page_id ? array() : $templates;
			},
			10,
			2
		);
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_id', $page_id );
		$this->assertSame( array(), rest_get_server()->dispatch( $request )->get_data() );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Not testing item creation.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Not testing item update.
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
