<?php

class Gutenberg_REST_Templates_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;
	private static $post;

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

	public function set_up() {
		parent::set_up();
	}

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		switch_theme( 'emptytheme' );
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		// Set up template post.
		$args       = array(
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
		self::$post = self::factory()->post->create_and_get( $args );
		wp_set_post_terms( self::$post->ID, get_stylesheet(), 'wp_theme' );
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/templates/lookup',
			$routes,
			'Get template fallback content route does not exist'
		);
	}

	public function test_get_template_fallback() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates/lookup' );
		// Should fallback to `category.html`.
		$request->set_param( 'slug', 'category-fruits' );
		$request->set_param( 'is_custom', false );
		$request->set_param( 'template_prefix', 'category' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'category', $response->get_data()['slug'], 'Should fallback to `category.html`.' );
		// Should fallback to `singular.html`.
		$request->set_param( 'slug', 'page-hello' );
		$request->set_param( 'is_custom', false );
		$request->set_param( 'template_prefix', 'page' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'singular', $response->get_data()['slug'], 'Should fallback to `singular.html`.' );
		// Should fallback to `index.html`.
		$request->set_param( 'slug', 'author' );
		$request->set_param( 'ignore_empty', true );
		$request->set_param( 'is_custom', false );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'index', $response->get_data()['slug'], 'Should fallback to `index.html`.' );
		// Should fallback to `index.html`.
		$request->set_param( 'slug', 'tag-rigas' );
		$request->set_param( 'is_custom', false );
		$request->set_param( 'template_prefix', 'tag' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'index', $response->get_data()['slug'], 'Should fallback to `index.html`.' );
	}

	/**
	 * @covers WP_REST_Templates_Controller::get_item_schema
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/templates' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertCount( 15, $properties );
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
	}

	/**
	 * @covers WP_REST_Templates_Controller::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/emptytheme//my_template' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['content'] );
		unset( $data['_links'] );

		$this->assertSame(
			array(
				'id'             => 'emptytheme//my_template',
				'theme'          => 'emptytheme',
				'slug'           => 'my_template',
				'source'         => 'custom',
				'origin'         => null,
				'type'           => 'wp_template',
				'description'    => 'Description of my template.',
				'title'          => array(
					'raw'      => 'My Template',
					'rendered' => 'My Template',
				),
				'status'         => 'publish',
				'wp_id'          => self::$post->ID,
				'has_theme_file' => false,
				'is_custom'      => true,
				'author'         => 0,
				'modified'       => mysql_to_rfc3339( self::$post->post_modified ),
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
				'id'             => 'emptytheme//my_template',
				'theme'          => 'emptytheme',
				'slug'           => 'my_template',
				'source'         => 'custom',
				'origin'         => null,
				'type'           => 'wp_template',
				'description'    => 'Description of my template.',
				'title'          => array(
					'raw'      => 'My Template',
					'rendered' => 'My Template',
				),
				'status'         => 'publish',
				'wp_id'          => self::$post->ID,
				'has_theme_file' => false,
				'is_custom'      => true,
				'author'         => 0,
				'modified'       => mysql_to_rfc3339( self::$post->post_modified ),
			),
			$this->find_and_normalize_template_by_id( $data, 'emptytheme//my_template' )
		);
	}

	/**
	 * @covers WP_REST_Templates_Controller::update_item
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/emptytheme//my_template' );
		$request->set_body_params(
			array(
				'title' => 'My new Index Title',
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 'My new Index Title', $data['title']['raw'] );
		$this->assertSame( 'custom', $data['source'] );
		$this->assertIsString( $data['modified'] );
	}

	/**
	 * @covers WP_REST_Templates_Controller::create_item
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/templates' );
		$request->set_body_params(
			array(
				'slug'        => 'my_custom_template',
				'description' => 'Just a description',
				'title'       => 'My Template',
				'content'     => 'Content',
				'author'      => self::$admin_id,
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['_links'] );
		unset( $data['wp_id'] );

		$this->assertSame(
			array(
				'id'             => 'emptytheme//my_custom_template',
				'theme'          => 'emptytheme',
				'content'        => array(
					'raw' => 'Content',
				),
				'slug'           => 'my_custom_template',
				'source'         => 'custom',
				'origin'         => null,
				'type'           => 'wp_template',
				'description'    => 'Just a description',
				'title'          => array(
					'raw'      => 'My Template',
					'rendered' => 'My Template',
				),
				'status'         => 'publish',
				'has_theme_file' => false,
				'is_custom'      => true,
				'author'         => self::$admin_id,
				'modified'       => $data['modified'],
			),
			$data
		);
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {}
}
