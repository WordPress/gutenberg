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
		switch_theme( 'emptytheme' );
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
		// This creates the global styles for the current theme.
		self::$global_styles_id = wp_insert_post(
			array(
				'post_content' => '{"version": ' . WP_Theme_JSON_Gutenberg::LATEST_SCHEMA . ', "isGlobalStylesUserThemeJSON": true }',
				'post_status'  => 'publish',
				'post_title'   => __( 'Custom Styles', 'default' ),
				'post_type'    => 'wp_global_styles',
				'post_name'    => 'wp-global-styles-emptytheme',
				'tax_input'    => array(
					'wp_theme' => 'emptytheme',
				),
			),
			true
		);
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

	/**
	 * @group tsek
	 */
	public function test_get_theme_items() {
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/themes/emptytheme/variations' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEmpty( $data );

		// We create a global style variation by creating a `styles` folder with
		// a `theme.json` variation.
		$styles_path  = gutenberg_dir_path() . 'test/emptytheme/styles';
		$fixture_name = 'theme-json-variation.json';
		$fixture      = gutenberg_dir_path() . "phpunit/fixtures/$fixture_name";
		if ( ! file_exists( $styles_path ) ) {
			mkdir( $styles_path, 0777, true );
		}
		copy( $fixture, "$styles_path/$fixture_name" );
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
			),
		);
		$this->assertSameSetsWithIndex( $data, $expected );

		// Delete copied files.
		array_map( 'unlink', glob( "$styles_path/*.*" ) );
		rmdir( $styles_path );
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
				'id'       => self::$global_styles_id,
				'title'    => array(
					'raw'      => 'Custom Styles',
					'rendered' => 'Custom Styles',
				),
				'settings' => new stdClass(),
				'styles'   => new stdClass(),
			),
			$data
		);
	}

	public function test_create_item() {
		$this->markTestIncomplete();
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
		$this->markTestIncomplete();
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
