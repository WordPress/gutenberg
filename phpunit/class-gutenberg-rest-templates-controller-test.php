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
