<?php
/**
 * REST API: REST_Block_Types_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Widgets.
 *
 * @see WP_Test_REST_Controller_Testcase
 */
class REST_Block_Types_Controller_Test extends WP_Test_REST_TestCase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		wp_register_script( 'core-assets-test-script', home_url( '/assets/test-script.js' ) );
		wp_register_script( 'core-assets-test-editor-script', home_url( '/assets/test-editor-script.js' ) );
		wp_register_style( 'core-assets-test-style', home_url( '/assets/test-style.css' ) );
		wp_register_style( 'core-assets-test-editor-style', home_url( '/assets/test-editor-style.css' ) );
	}

	/**
	 * Tear down after class tests are done.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		unregister_block_type( 'core/assets-test' );
	}

	/**
	 * Set up each test method.
	 */
	public function setUp() {
		parent::setUp();
	}

	/**
	 * Tear down each test method.
	 */
	public function tearDown() {
		parent::tearDown();
	}

	/**
	 * Test whether test block type contains scripts/styles links.
	 *
	 * @dataProvider dataProviderTestCases
	 */
	public function test_links_in_block( $block_name, $block_parameters ) {
		wp_set_current_user( self::$admin_id );
		register_block_type( $block_name, $block_parameters );
		$endpoint = sprintf( '/wp/v2/block-types/%s', $block_name );
		$request  = new WP_REST_Request( 'GET', $endpoint );
		$response = rest_get_server()->dispatch( $request );
		$links    = $response->get_links();
		$this->assertEquals( 200, $response->get_status() );
		foreach ( $block_parameters as $block_parameter => $parameter_value ) {
			$links_key = sprintf( 'https://api.w.org/%s', $block_parameter );
			if ( empty( $parameter_value ) ) {
				$this->assertArrayNotHasKey( $links_key, $links );
			} else {
				$this->assertArrayHasKey( $links_key, $links );
				$this->assertNotEmpty( $links[ $links_key ] );
			}
		}
	}

	/**
	 * Provide test cases.
	 *
	 * @return array[]
	 */
	public function dataProviderTestCases() {
		return array(
			array(
				'core/assets-test-1',
				array(
					'script'        => '',
					'style'         => '',
					'editor_script' => '',
					'editor_style'  => '',
				),
			),
			array(
				'core/assets-test-2',
				array(
					'script'        => 'core-assets-test-script',
					'style'         => '',
					'editor_script' => '',
					'editor_style'  => '',
				),
			),
			array(
				'core/assets-test-3',
				array(
					'script'        => '',
					'style'         => 'core-assets-test-style',
					'editor_script' => '',
					'editor_style'  => '',
				),
			),
			array(
				'core/assets-test-4',
				array(
					'script'        => '',
					'style'         => '',
					'editor_script' => 'core-assets-test-editor-script',
					'editor_style'  => '',
				),
			),
			array(
				'core/assets-test-5',
				array(
					'script'        => '',
					'style'         => '',
					'editor_script' => '',
					'editor_style'  => 'core-assets-test-editor-style',
				),
			),
			array(
				'core/assets-test-6',
				array(
					'script'        => '',
					'style'         => 'core-assets-test-style',
					'editor_script' => '',
					'editor_style'  => 'core-assets-test-editor-style',
				),
			),
			array(
				'core/assets-test-7',
				array(
					'script'        => 'core-assets-test-script',
					'style'         => 'core-assets-test-style',
					'editor_script' => 'core-assets-test-editor-script',
					'editor_style'  => 'core-assets-test-editor-style',
				),
			),
			array(
				'core/assets-test-8',
				array(
					'script'        => 'core-assets-test-script',
					'style'         => '',
					'editor_script' => 'core-assets-test-editor-script',
					'editor_style'  => 'core-assets-test-editor-style',
				),
			),
		);
	}
}
