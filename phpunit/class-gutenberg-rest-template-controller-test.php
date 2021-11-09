<?php

class Gutenberg_REST_Templates_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		switch_theme( 'tt1-blocks' );
		gutenberg_register_template_post_type();
		gutenberg_register_template_part_post_type();
		gutenberg_register_wp_theme_taxonomy();
		gutenberg_register_wp_template_part_area_taxonomy();
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/templates', $routes );
		$this->assertArrayHasKey( '/wp/v2/templates/(?P<id>[\/\w-]+)', $routes );

		$this->assertArrayHasKey( '/wp/v2/template-parts', $routes );
		$this->assertArrayHasKey( '/wp/v2/template-parts/(?P<id>[\/\w-]+)', $routes );
	}

	public function test_context_param() {
		// TODO: Implement test_context_param() method.
		$this->markTestIncomplete();
	}

	public function test_get_items() {
		function find_and_normalize_template_by_id( $templates, $id ) {
			foreach ( $templates as $template ) {
				if ( $template['id'] === $id ) {
					unset( $template['content'] );
					unset( $template['_links'] );
					return $template;
				}
			}

			return null;
		}

		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_manage_templates', $response, 401 );

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			array(
				'id'             => 'tt1-blocks//index',
				'theme'          => 'tt1-blocks',
				'slug'           => 'index',
				'title'          => array(
					'raw'      => 'Index',
					'rendered' => 'Index',
				),
				'description'    => 'The default template used when no other template is available. This is a required template in WordPress.',
				'status'         => 'publish',
				'source'         => 'theme',
				'type'           => 'wp_template',
				'wp_id'          => null,
				'has_theme_file' => true,
			),
			find_and_normalize_template_by_id( $data, 'tt1-blocks//index' )
		);

		// Test template parts.
		$request  = new WP_REST_Request( 'GET', '/wp/v2/template-parts' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals(
			array(
				'id'             => 'tt1-blocks//header',
				'theme'          => 'tt1-blocks',
				'slug'           => 'header',
				'title'          => array(
					'raw'      => 'header',
					'rendered' => 'header',
				),
				'description'    => '',
				'status'         => 'publish',
				'source'         => 'theme',
				'type'           => 'wp_template_part',
				'wp_id'          => null,
				'area'           => WP_TEMPLATE_PART_AREA_HEADER,
				'has_theme_file' => true,
			),
			find_and_normalize_template_by_id( $data, 'tt1-blocks//header' )
		);
	}

	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/tt1-blocks//index' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['content'] );
		unset( $data['_links'] );

		$this->assertEquals(
			array(
				'id'             => 'tt1-blocks//index',
				'theme'          => 'tt1-blocks',
				'slug'           => 'index',
				'title'          => array(
					'raw'      => 'Index',
					'rendered' => 'Index',
				),
				'description'    => 'The default template used when no other template is available. This is a required template in WordPress.',
				'status'         => 'publish',
				'source'         => 'theme',
				'type'           => 'wp_template',
				'wp_id'          => null,
				'has_theme_file' => true,
			),
			$data
		);

		// Test template parts.
		$request  = new WP_REST_Request( 'GET', '/wp/v2/template-parts/tt1-blocks//header' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['content'] );
		unset( $data['_links'] );
		$this->assertEquals(
			array(
				'id'             => 'tt1-blocks//header',
				'theme'          => 'tt1-blocks',
				'slug'           => 'header',
				'title'          => array(
					'raw'      => 'header',
					'rendered' => 'header',
				),
				'description'    => '',
				'status'         => 'publish',
				'source'         => 'theme',
				'type'           => 'wp_template_part',
				'wp_id'          => null,
				'area'           => WP_TEMPLATE_PART_AREA_HEADER,
				'has_theme_file' => true,
			),
			$data
		);
	}

	public function test_create_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/templates' );
		$request->set_body_params(
			array(
				'slug'        => 'my_custom_template',
				'title'       => 'My Template',
				'description' => 'Just a description',
				'content'     => 'Content',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['_links'] );
		unset( $data['wp_id'] );

		$this->assertEquals(
			array(
				'id'             => 'tt1-blocks//my_custom_template',
				'theme'          => 'tt1-blocks',
				'slug'           => 'my_custom_template',
				'title'          => array(
					'raw'      => 'My Template',
					'rendered' => 'My Template',
				),
				'description'    => 'Just a description',
				'status'         => 'publish',
				'source'         => 'custom',
				'type'           => 'wp_template',
				'content'        => array(
					'raw' => 'Content',
				),
				'has_theme_file' => false,
			),
			$data
		);

		// Test template parts.
		$request = new WP_REST_Request( 'POST', '/wp/v2/template-parts' );
		$request->set_body_params(
			array(
				'slug'        => 'my_custom_template_part',
				'title'       => 'My Template Part',
				'description' => 'Just a description of a template part',
				'content'     => 'Content',
				'area'        => 'header',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['_links'] );
		unset( $data['wp_id'] );

		$this->assertEquals(
			array(
				'id'             => 'tt1-blocks//my_custom_template_part',
				'theme'          => 'tt1-blocks',
				'slug'           => 'my_custom_template_part',
				'title'          => array(
					'raw'      => 'My Template Part',
					'rendered' => 'My Template Part',
				),
				'description'    => 'Just a description of a template part',
				'status'         => 'publish',
				'source'         => 'custom',
				'type'           => 'wp_template_part',
				'content'        => array(
					'raw' => 'Content',
				),
				'area'           => 'header',
				'has_theme_file' => false,
			),
			$data
		);
	}

	public function test_update_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/templates/tt1-blocks//index' );
		$request->set_body_params(
			array(
				'title' => 'My new Index Title',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'My new Index Title', $data['title']['raw'] );
		$this->assertEquals( 'custom', $data['source'] );

		// Test template parts.
		$request = new WP_REST_Request( 'PUT', '/wp/v2/template-parts/tt1-blocks//header' );
		$request->set_body_params(
			array(
				'area' => 'something unsupported',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( WP_TEMPLATE_PART_AREA_UNCATEGORIZED, $data['area'] );
		$this->assertEquals( 'custom', $data['source'] );
	}

	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/templates/justrandom//template' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_template_not_found', $response, 404 );

		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/templates/tt1-blocks//single' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_template', $response, 400 );
	}

	public function test_prepare_item() {
		// TODO: Implement test_prepare_item() method.
		$this->markTestIncomplete();
	}

	public function test_get_item_schema() {
		// TODO: Implement test_get_item_schema() method.
		$this->markTestIncomplete();
	}
}
