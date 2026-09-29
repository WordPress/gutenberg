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
	 * Requests the choices for an edited page slug.
	 *
	 * @param string $slug Edited slug.
	 * @return WP_REST_Response Response.
	 */
	private function get_page_template_choices( $slug ) {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_type', 'page' );
		$request->set_param( 'slug', $slug );
		return rest_get_server()->dispatch( $request );
	}

	public function test_post_template_choices_require_a_post_type() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'slug', 'home' );
		$this->assertSame( 400, rest_get_server()->dispatch( $request )->get_status() );
	}

	public function test_post_template_choices_include_the_edited_slug_default_before_filtering() {
		$seen_query = null;
		$seen_ids   = array();
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) use ( &$seen_query, &$seen_ids ) {
				if ( isset( $query['slug'] ) ) {
					$seen_query = $query;
					$seen_ids   = wp_list_pluck( $templates, 'id' );
				}
				return $templates;
			},
			10,
			2
		);
		$response = $this->get_page_template_choices( 'home' );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'home', $seen_query['slug'] );
		$this->assertSame( 'page', $seen_query['post_type'] );
		$this->assertContains( 'block-theme//page-home', $seen_ids );
	}

	public function test_empty_slug_uses_the_regular_template_collection() {
		$response = $this->get_page_template_choices( '' );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_type', 'page' );
		$regular_response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $regular_response->get_data(), $response->get_data() );

		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'slug', '' );
		$this->assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
	}

	public function test_ambiguous_draft_slug_offers_the_generic_default() {
		for ( $i = 0; $i < 2; $i++ ) {
			self::factory()->post->create(
				array(
					'post_type'   => 'page',
					'post_status' => 'draft',
					'post_name'   => 'home',
				)
			);
		}
		$response = $this->get_page_template_choices( 'home' );
		$ids      = wp_list_pluck( $response->get_data(), 'id' );
		$this->assertSame( 'block-theme//page', $ids[0] );
	}

	public function test_filter_can_remove_every_choice_without_changing_saved_assignments() {
		$post_ids = array();
		foreach ( array( 'draft', 'publish' ) as $status ) {
			$post_id = self::factory()->post->create(
				array(
					'post_type'   => 'page',
					'post_status' => $status,
					'post_name'   => 'filtered-' . $status,
				)
			);
			update_post_meta( $post_id, '_wp_page_template', 'custom-hero-template' );
			$post_ids[] = $post_id;
		}
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) {
				return isset( $query['slug'] ) ? array() : $templates;
			},
			10,
			2
		);
		foreach ( $post_ids as $post_id ) {
			$response = $this->get_page_template_choices( get_post( $post_id )->post_name );
			$this->assertSame( array(), $response->get_data() );
			$this->assertSame( 'custom-hero-template', get_page_template_slug( $post_id ) );
		}
		$this->assertInstanceOf( WP_Block_Template::class, get_block_template( 'block-theme//custom-hero-template' ) );
	}

	public function test_filter_order_is_preserved_without_restoring_the_default() {
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) {
				if ( isset( $query['slug'] ) ) {
					return array(
						get_block_template( 'block-theme//custom-hero-template' ),
						get_block_template( 'block-theme//custom-single-post-template' ),
					);
				}
				return $templates;
			},
			10,
			2
		);
		$response = $this->get_page_template_choices( 'home' );
		$this->assertSame(
			array( 'block-theme//custom-hero-template', 'block-theme//custom-single-post-template' ),
			wp_list_pluck( $response->get_data(), 'id' )
		);
	}

	public function test_post_template_filter_does_not_change_queries_without_a_slug() {
		$this->get_page_template_choices( 'home' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_type', 'page' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertNotContains( 'block-theme//page', wp_list_pluck( $response->get_data(), 'id' ) );
	}

	public function test_invalid_filtered_templates_are_ignored_and_duplicates_are_removed() {
		add_filter(
			'get_block_templates',
			static function ( $templates, $query ) {
				if ( isset( $query['slug'] ) ) {
					$template = get_block_template( 'block-theme//page-home' );
					return array( null, 'invalid', $template, $template );
				}
				return $templates;
			},
			10,
			2
		);
		$response = $this->get_page_template_choices( 'home' );
		$this->assertSame( array( 'block-theme//page-home' ), wp_list_pluck( $response->get_data(), 'id' ) );
	}

	public function test_post_template_choices_reject_an_invalid_slug_type() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_type', 'page' );
		$request->set_param( 'slug', array( 'home' ) );
		$this->assertSame( 400, rest_get_server()->dispatch( $request )->get_status() );
	}

	public function test_post_template_choices_respect_the_wp_id_constraint() {
		$this->get_page_template_choices( 'home' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$request->set_param( 'post_type', 'page' );
		$request->set_param( 'slug', 'home' );
		$request->set_param( 'wp_id', self::$template_post->ID );
		$response = rest_get_server()->dispatch( $request );
		foreach ( $response->get_data() as $template ) {
			$this->assertSame( self::$template_post->ID, $template['wp_id'] );
		}
		$this->assertNotContains( 'block-theme//page-home', wp_list_pluck( $response->get_data(), 'id' ) );
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
