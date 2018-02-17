<?php
/**
 * Shortcode block preview rendering tests.
 *
 * @package Gutenberg
 */

/**
 * Tests shortcode block preview rendering.
 */
class REST_Shortcodes_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * Fake user ID.
	 *
	 * @var int
	 */
	protected static $user_id;

	/**
	 * Our fake subscriber's user ID.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * Fake post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Create fake data before tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that creates fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_id       = $factory->user->create( array(
			'role' => 'editor',
		) );
		self::$subscriber_id = $factory->user->create( array(
			'role' => 'subscriber',
		) );

		self::$post_id = $factory->post->create( array(
			'post_author'  => self::$user_id,
			'post_type'    => 'post',
			'post_status'  => 'publish',
			'post_title'   => 'Test Post',
			'post_content' => '<p>Hello world!</p>',
		) );
	}

	/**
	 * Delete fake data after tests run.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id, true );
		self::delete_user( self::$user_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Check that our routes get set up properly.
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/gutenberg/v1/shortcodes', $routes );
		$this->assertCount( 1, $routes['/gutenberg/v1/shortcodes'] );
	}

	/**
	 * Check that users without permission can't GET the shortcode content.
	 */
	public function test_get_items_when_not_allowed() {
		wp_set_current_user( self::$subscriber_id );
		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/shortcodes' );
		$request->set_query_params(
			array(
				'shortcode' => '',
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'gutenberg_shortcode_block_cannot_read', $data['code'] );
	}

	/**
	 * Test cases for test_update_item_with_invalid_fields().
	 *
	 * @return array
	 */
	public function data_get_item_with_field_combinations() {
		return array(
			array(
				array(
					'shortcode' => 'Any Random Text',
				),
				array(
					'html'  => 'Any Random Text',
					'type'  => 'html',
					'style' => '',
					'js'    => '',
				),
			),
			// [caption] default shortcode will also return the default theme style sheet.
			array(
				array(
					'shortcode' => '[caption]My Caption[/caption]',
				),
				array(
					'html'  => 'My Caption',
					'type'  => 'html',
					'style' => '<link rel="stylesheet" type="text/css" href="/tmp/wordpress-tests-lib/includes/../data/themedir1/default/style.css" />',
					'js'    => '',
				),
			),
			// Sending an empty string.
			array(
				array(
					'shortcode' => ' ',
					'postId'    => self::$post_id,
				),
				array(
					'html'  => 'Enter something to preview',
					'type'  => 'html',
					'style' => '',
					'js'    => '',
				),
			),
			// Sending invalid shortcode attribute.
			array(
				array(
					'shortcode' => '[audio ids="1"]',
					'postId'    => self::$post_id,
				),
				array(
					'html'  => 'Sorry, couldn\'t render a preview',
					'type'  => 'html',
					'style' => '',
					'js'    => '',
				),
			),
			// Youtube embed.
			array(
				array(
					'shortcode' => '[embed]https://www.youtube.com/watch?v=8OBfr46Y0cQ[/embed]',
					'postId'    => self::$post_id,
				),
				array(
					'html'  => '<iframe width="600" height="338" src="https://www.youtube.com/embed/8OBfr46Y0cQ?feature=oembed" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>',
					'type'  => 'video',
					'style' => '',
					'js'    => '',
				),
			),
			// Vimeo embed.
			array(
				array(
					'shortcode' => '[embed]https://vimeo.com/81625407[/embed]',
					'postId'    => self::$post_id,
				),
				array(
					'html'  => '<iframe src="https://player.vimeo.com/video/81625407" width="600" height="338" frameborder="0" title="What is WordPress?" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',
					'type'  => 'video',
					'style' => '',
					'js'    => '',
				),
			),
			// Not sending shortcode attribute.
			array(
				array(),
				array(
					'html'  => 'Enter something to preview',
					'type'  => 'html',
					'style' => '',
					'js'    => '',
				),
			),
			// Sending valid UTF-8.
			array(
				array(
					'shortcode' => '\xe2\x82\xa1',
					'postId'    => self::$post_id,
				),
				array(
					'html'  => '\xe2\x82\xa1',
					'type'  => 'html',
					'style' => '',
					'js'    => '',
				),
			),
		);
	}

	/**
	 * Check that attributes are validated correctly when we GET shortcode content.
	 *
	 * @dataProvider data_get_item_with_field_combinations
	 */
	public function test_get_item_with_field_combinations( $body_params, $expected_message ) {
		wp_set_current_user( self::$user_id );
		$request = new WP_REST_Request( 'GET', '/gutenberg/v1/shortcodes' );
		$request->set_query_params( $body_params );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $expected_message['html'], $data['html'] );
		$this->assertEquals( $expected_message['type'], $data['type'] );
		$this->assertEquals( $expected_message['style'], $data['style'] );
		$this->assertEquals( $expected_message['js'], $data['js'] );
	}
	public function test_context_param() {
		$this->markTestSkipped( 'Controller doesn\'t implement get_context_param().' );
	}
	public function test_create_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement create_item().' );
	}
	public function test_delete_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement delete_item().' );
	}
	public function test_prepare_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement prepare_item().' );
	}
	public function test_get_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement prepare_item().' );
	}
	public function test_get_items() {
		$this->markTestSkipped( 'Controller doesn\'t implement prepare_item().' );
	}
	public function test_update_item() {
		$this->markTestSkipped( 'Controller doesn\'t implement prepare_item().' );
	}
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/gutenberg/v1/shortcodes' );
		$response   = $this->server->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 4, count( $properties ) );
		$this->assertArrayHasKey( 'html', $properties );
		$this->assertArrayHasKey( 'type', $properties );
		$this->assertArrayHasKey( 'style', $properties );
		$this->assertArrayHasKey( 'js', $properties );
	}
}
