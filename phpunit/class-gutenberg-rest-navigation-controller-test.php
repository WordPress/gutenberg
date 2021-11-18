<?php

class Gutenberg_REST_Navigation_Controller_Test extends WP_Test_REST_Controller_Testcase {
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
		gutenberg_register_navigation_post_type();
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/navigation', $routes );
		$this->assertArrayHasKey( '/wp/v2/navigation/(?P<id>[\/\w-]+)', $routes );
	}

	public function test_context_param() {
		// TODO: Implement test_context_param() method.
		$this->markTestIncomplete();
	}

	public function test_get_items() {
		$this->markTestIncomplete();

//		function find_and_normalize_template_by_id( $templates, $id ) {
//			foreach ( $templates as $template ) {
//				if ( $template['id'] === $id ) {
//					unset( $template['content'] );
//					unset( $template['_links'] );
//					return $template;
//				}
//			}
//
//			return null;
//		}
//
//		wp_set_current_user( 0 );
//		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
//		$response = rest_get_server()->dispatch( $request );
//		$this->assertErrorResponse( 'rest_cannot_manage_templates', $response, 401 );
//
//		wp_set_current_user( self::$admin_id );
//		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
//		$response = rest_get_server()->dispatch( $request );
//		$data     = $response->get_data();
//
//		$this->assertEquals(
//			array(
//				'id'             => 'tt1-blocks//index',
//				'theme'          => 'tt1-blocks',
//				'slug'           => 'index',
//				'title'          => array(
//					'raw'      => 'Index',
//					'rendered' => 'Index',
//				),
//				'description'    => 'The default template used when no other template is available. This is a required template in WordPress.',
//				'status'         => 'publish',
//				'source'         => 'theme',
//				'type'           => 'wp_template',
//				'wp_id'          => null,
//				'has_theme_file' => true,
//			),
//			find_and_normalize_template_by_id( $data, 'tt1-blocks//index' )
//		);
//
//		// Test template parts.
//		$request  = new WP_REST_Request( 'GET', '/wp/v2/template-parts' );
//		$response = rest_get_server()->dispatch( $request );
//		$data     = $response->get_data();
//
//		$this->assertEquals(
//			array(
//				'id'             => 'tt1-blocks//header',
//				'theme'          => 'tt1-blocks',
//				'slug'           => 'header',
//				'title'          => array(
//					'raw'      => 'header',
//					'rendered' => 'header',
//				),
//				'description'    => '',
//				'status'         => 'publish',
//				'source'         => 'theme',
//				'type'           => 'wp_template_part',
//				'wp_id'          => null,
//				'area'           => WP_TEMPLATE_PART_AREA_HEADER,
//				'has_theme_file' => true,
//			),
//			find_and_normalize_template_by_id( $data, 'tt1-blocks//header' )
//		);
	}

	public function test_get_item() {
		$this->markTestIncomplete();
//		wp_set_current_user( self::$admin_id );
//		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/tt1-blocks//index' );
//		$response = rest_get_server()->dispatch( $request );
//		$data     = $response->get_data();
//		unset( $data['content'] );
//		unset( $data['_links'] );
//
//		$this->assertEquals(
//			array(
//				'id'             => 'tt1-blocks//index',
//				'theme'          => 'tt1-blocks',
//				'slug'           => 'index',
//				'title'          => array(
//					'raw'      => 'Index',
//					'rendered' => 'Index',
//				),
//				'description'    => 'The default template used when no other template is available. This is a required template in WordPress.',
//				'status'         => 'publish',
//				'source'         => 'theme',
//				'type'           => 'wp_template',
//				'wp_id'          => null,
//				'has_theme_file' => true,
//			),
//			$data
//		);
//
//		// Test template parts.
//		$request  = new WP_REST_Request( 'GET', '/wp/v2/template-parts/tt1-blocks//header' );
//		$response = rest_get_server()->dispatch( $request );
//		$data     = $response->get_data();
//		unset( $data['content'] );
//		unset( $data['_links'] );
//		$this->assertEquals(
//			array(
//				'id'             => 'tt1-blocks//header',
//				'theme'          => 'tt1-blocks',
//				'slug'           => 'header',
//				'title'          => array(
//					'raw'      => 'header',
//					'rendered' => 'header',
//				),
//				'description'    => '',
//				'status'         => 'publish',
//				'source'         => 'theme',
//				'type'           => 'wp_template_part',
//				'wp_id'          => null,
//				'area'           => WP_TEMPLATE_PART_AREA_HEADER,
//				'has_theme_file' => true,
//			),
//			$data
//		);
	}

	public function test_create_item() {
		$this->markTestIncomplete();
	}

	public function _test_create_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/navigation' );
		$request->set_body_params(
			array(
				'id'        => 'wp-header-menu',
				'name'        => 'wp-header-menu',
				'slug'        => 'wp-header-menu',
				'title'       => 'Header menu',
				'description' => 'Just a description',
				'content'     => '<!-- wp:navigation-link {"isTopLevelLink":true} /-->',
				'status'      => 'publish',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['_links'] );
		unset( $data['wp_id'] );
		unset( $data['date'] );
		unset( $data['date_gmt'] );
		unset( $data['guid'] );
		unset( $data['modified'] );
		unset( $data['modified_gmt'] );
		unset( $data['password'] );
		unset( $data['link'] );
		unset( $data['template'] );

//		$this->assertEquals(
//			array(
//				'id'      => 'wp-header-menu',
//				'slug'    => 'wp-header-menu',
//				'title'   => array(
//					'raw'      => 'Header menu',
//					'rendered' => 'Header menu',
//				),
//				'status'  => 'publish',
//				'type'    => 'wp_navigation',
//				'content' => array(
//					'raw'           => '<!-- wp:navigation-link {"isTopLevelLink":true} /-->',
//					'rendered'      => '',
//					'protected'     => false,
//					'block_version' => 1,
//				),
//			),
//			$data
//		);
	}

	public function test_create_update_get() {
//		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/navigation/wp-header-menu' );
//		$response = rest_get_server()->dispatch( $request );

		$this->_test_create_item();
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/navigation/wp-header-menu' );
		$request->set_body_params(
			array(
				'id'      => 'wp-header-menu',
				'title'   => 'My new Index Title',
				'content' => '<!-- wp:navigation-link {"isTopLevelLink":true} /-->',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'My new Index Title', $data['title']['raw'] );
		$this->assertEquals( 'wp-header-menu', $data['slug'] );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/navigation/wp-header-menu' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'wp-header-menu', $data['slug'] );
		$this->assertEquals( '<!-- wp:navigation-link {"isTopLevelLink":true} /-->', $data['content']['raw'] );
	}

	public function test_update_item() {
		$this->markTestIncomplete();
//		$this->test_create_item();
//		wp_set_current_user( self::$admin_id );
//		$request = new WP_REST_Request( 'PUT', '/wp/v2/navigation/wp-header-menu' );
//		$request->set_body_params(
//			array(
//				'id'      => 'wp-header-menu',
//				'title'   => 'My new Index Title',
//				'content' => '<!-- wp:navigation-link {"isTopLevelLink":true} /-->',
//			)
//		);
	}

	public function test_delete_item() {
		$this->markTestIncomplete();
//		wp_set_current_user( self::$admin_id );
//		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/templates/justrandom//template' );
//		$response = rest_get_server()->dispatch( $request );
//		$this->assertErrorResponse( 'rest_template_not_found', $response, 404 );
//
//		wp_set_current_user( self::$admin_id );
//		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/templates/tt1-blocks//single' );
//		$response = rest_get_server()->dispatch( $request );
//		$this->assertErrorResponse( 'rest_invalid_template', $response, 400 );
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
