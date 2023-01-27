<?php

class Gutenberg_REST_Global_Styles_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $global_styles_id;

	private function find_and_normalize_global_styles_by_id( $global_styles, $id ) {
		foreach ( $global_styles as $style ) {
			if ( $style['id'] === $id ) {
				unset( $style['_links'] );
				return $style;
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
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		switch_theme( 'emptytheme' );

		// This creates the global styles for the current theme.
		self::$global_styles_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	}


	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			// '/wp/v2/global-styles/(?P<id>[\/\s%\w\.\(\)\[\]\@_\-]+)',
			'/wp/v2/global-styles/(?P<id>[\/\w-]+)',
			$routes,
			'Single global style based on the given ID route does not exist'
		);
		$this->assertArrayHasKey(
			'/wp/v2/global-styles/themes/(?P<stylesheet>[^\/:<>\*\?"\|]+(?:\/[^\/:<>\*\?"\|]+)?)',
			$routes,
			'Theme global styles route does not exist'
		);
		$this->assertArrayHasKey(
			'/wp/v2/global-styles/themes/(?P<stylesheet>[\/\s%\w\.\(\)\[\]\@_\-]+)/variations',
			$routes,
			'Theme global styles variations route does not exist'
		);
	}

	public function test_context_param() {
		// TODO: Implement test_context_param() method.
		$this->markTestIncomplete();
	}

	public function test_get_theme_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/themes/emptytheme/variations' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$expected = array(
			array(
				'version'  => 2,
				'settings' => array(
					'color' => array(
						'palette' => array(
							'theme' => array(
								array(
									'slug'  => 'foreground',
									'color' => '#3F67C6',
									'name'  => 'Foreground',
								),
							),
						),
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/post-title' => array(
							'typography' => array(
								'fontWeight' => '700',
							),
						),
					),
				),
				'title'    => 'variation',
			),
		);
		$this->assertSameSetsWithIndex( $data, $expected );
	}

	public function test_get_items() {
		$this->markTestIncomplete();
	}

	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['_links'] );

		$this->assertEquals(
			array(
				'id'                  => self::$global_styles_id,
				'title'               => array(
					'raw'      => 'Custom Styles',
					'rendered' => 'Custom Styles',
				),
				'settings'            => new stdClass(),
				'styles'              => new stdClass(),
				'associated_style_id' => null,
			),
			$data
		);
	}

	public function test_create_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/global-styles' );
		$request->set_body_params(
			array(
				'title'    => 'Custom user variation',
				'settings' => new stdClass(),
				'styles'   => new stdClass(),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		unset( $data['_links'] );

		$this->assertEquals(
			array(
				'title' => array(
					'raw'      => 'Custom user variation',
					'rendered' => 'Custom user variation',
				),
			),
			array(
				'title' => $data['title'],
			)
		);
	}

	public function test_update_item() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/global-styles/' . self::$global_styles_id );
		$request->set_body_params(
			array(
				'title' => 'My new global styles title',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'My new global styles title', $data['title']['raw'] );
	}

	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );
		$post_id  = WP_Theme_JSON_Resolver_Gutenberg::add_user_global_styles_variation(
			array(
				'title'         => 'Title',
				'global_styles' => \wp_json_encode(
					array(
						'settings' => new stdClass,
						'styles'   => new stdClass,
					)
				),
				'stylesheet'    => get_stylesheet(),
			)
		);
		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/global-styles/' . $post_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertTrue( $data['deleted'] );
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
