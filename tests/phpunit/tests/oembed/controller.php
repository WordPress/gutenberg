<?php

/**
 * @group oembed
 * @group restapi
 */
class Test_oEmbed_Controller extends WP_UnitTestCase {
	/**
	 * @var WP_REST_Server
	 */
	protected $server;

	public function setUp() {
		parent::setUp();

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$this->server = $wp_rest_server = new Spy_REST_Server();

		do_action( 'rest_api_init', $this->server );
	}

	function test_wp_oembed_ensure_format() {
		$this->assertEquals( 'json', wp_oembed_ensure_format( 'json' ) );
		$this->assertEquals( 'xml', wp_oembed_ensure_format( 'xml' ) );
		$this->assertEquals( 'json', wp_oembed_ensure_format( 123 ) );
		$this->assertEquals( 'json', wp_oembed_ensure_format( 'random' ) );
		$this->assertEquals( 'json', wp_oembed_ensure_format( array() ) );
	}

	function test_oembed_create_xml() {
		$actual = _oembed_create_xml( array(
			'foo'  => 'bar',
			'bar'  => 'baz',
			'ping' => 'pong',
		) );

		$expected = '<oembed><foo>bar</foo><bar>baz</bar><ping>pong</ping></oembed>';

		$this->assertStringEndsWith( $expected, trim( $actual ) );

		$actual = _oembed_create_xml( array(
			'foo'  => array(
				'bar' => 'baz',
			),
			'ping' => 'pong',
		) );

		$expected = '<oembed><foo><bar>baz</bar></foo><ping>pong</ping></oembed>';

		$this->assertStringEndsWith( $expected, trim( $actual ) );

		$actual = _oembed_create_xml( array(
			'foo'   => array(
				'bar' => array(
					'ping' => 'pong',
				),
			),
			'hello' => 'world',
		) );

		$expected = '<oembed><foo><bar><ping>pong</ping></bar></foo><hello>world</hello></oembed>';

		$this->assertStringEndsWith( $expected, trim( $actual ) );

		$actual = _oembed_create_xml( array(
			array(
				'foo' => array(
					'bar',
				),
			),
			'helloworld',
		) );

		$expected = '<oembed><oembed><foo><oembed>bar</oembed></foo></oembed><oembed>helloworld</oembed></oembed>';

		$this->assertStringEndsWith( $expected, trim( $actual ) );
	}

	public function test_route_availability() {
		// Check the route was registered correctly.
		$filtered_routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/oembed/1.0/embed', $filtered_routes );
		$route = $filtered_routes['/oembed/1.0/embed'];
		$this->assertCount( 1, $route );
		$this->assertArrayHasKey( 'callback', $route[0] );
		$this->assertArrayHasKey( 'methods', $route[0] );
		$this->assertArrayHasKey( 'args', $route[0] );
	}

	function test_request_with_wrong_method() {
		$request = new WP_REST_Request( 'POST', '/oembed/1.0/embed' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'rest_no_route', $data['code'] );
	}

	function test_request_without_url_param() {
		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'rest_missing_callback_param', $data['code'] );
		$this->assertEquals( 'url', $data['data']['params'][0] );
	}

	function test_request_with_bad_url() {
		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', 'http://google.com/' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'oembed_invalid_url', $data['code'] );
	}

	function test_request_invalid_format() {
		$post_id = $this->factory()->post->create();

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post_id ) );
		$request->set_param( 'format', 'random' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertInternalType( 'array', $data );
		$this->assertNotEmpty( $data );
	}

	function test_request_json() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = self::factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'maxwidth', 400 );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertInternalType( 'array', $data );
		$this->assertNotEmpty( $data );

		$this->assertArrayHasKey( 'version', $data );
		$this->assertArrayHasKey( 'provider_name', $data );
		$this->assertArrayHasKey( 'provider_url', $data );
		$this->assertArrayHasKey( 'author_name', $data );
		$this->assertArrayHasKey( 'author_url', $data );
		$this->assertArrayHasKey( 'title', $data );
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'width', $data );

		$this->assertEquals( '1.0', $data['version'] );
		$this->assertEquals( get_bloginfo( 'name' ), $data['provider_name'] );
		$this->assertEquals( get_home_url(), $data['provider_url'] );
		$this->assertEquals( $user->display_name, $data['author_name'] );
		$this->assertEquals( get_author_posts_url( $user->ID, $user->user_nicename ), $data['author_url'] );
		$this->assertEquals( $post->post_title, $data['title'] );
		$this->assertEquals( 'rich', $data['type'] );
		$this->assertTrue( $data['width'] <= $request['maxwidth'] );
	}

	/**
	 * @ticket 34971
	 */
	function test_request_static_front_page() {
		$post = self::factory()->post->create_and_get( array(
			'post_title' => 'Front page',
			'post_type'  => 'page',
		) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post->ID );

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', home_url() );
		$request->set_param( 'maxwidth', 400 );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertInternalType( 'array', $data );
		$this->assertNotEmpty( $data );

		$this->assertArrayHasKey( 'version', $data );
		$this->assertArrayHasKey( 'provider_name', $data );
		$this->assertArrayHasKey( 'provider_url', $data );
		$this->assertArrayHasKey( 'author_name', $data );
		$this->assertArrayHasKey( 'author_url', $data );
		$this->assertArrayHasKey( 'title', $data );
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'width', $data );

		$this->assertEquals( '1.0', $data['version'] );
		$this->assertEquals( get_bloginfo( 'name' ), $data['provider_name'] );
		$this->assertEquals( get_home_url(), $data['provider_url'] );
		$this->assertEquals( get_bloginfo( 'name' ), $data['author_name'] );
		$this->assertEquals( get_home_url(), $data['author_url'] );
		$this->assertEquals( $post->post_title, $data['title'] );
		$this->assertEquals( 'rich', $data['type'] );
		$this->assertTrue( $data['width'] <= $request['maxwidth'] );

		update_option( 'show_on_front', 'posts' );
	}

	function test_request_xml() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = self::factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'format', 'xml' );
		$request->set_param( 'maxwidth', 400 );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertInternalType( 'array', $data );
		$this->assertNotEmpty( $data );

		$this->assertArrayHasKey( 'version', $data );
		$this->assertArrayHasKey( 'provider_name', $data );
		$this->assertArrayHasKey( 'provider_url', $data );
		$this->assertArrayHasKey( 'author_name', $data );
		$this->assertArrayHasKey( 'author_url', $data );
		$this->assertArrayHasKey( 'title', $data );
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'width', $data );

		$this->assertEquals( '1.0', $data['version'] );
		$this->assertEquals( get_bloginfo( 'name' ), $data['provider_name'] );
		$this->assertEquals( get_home_url(), $data['provider_url'] );
		$this->assertEquals( $user->display_name, $data['author_name'] );
		$this->assertEquals( get_author_posts_url( $user->ID, $user->user_nicename ), $data['author_url'] );
		$this->assertEquals( $post->post_title, $data['title'] );
		$this->assertEquals( 'rich', $data['type'] );
		$this->assertTrue( $data['width'] <= $request['maxwidth'] );
	}

	/**
	 * @group multisite
	 * @group ms-required
	 */
	function test_request_ms_child_in_root_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$child = self::factory()->blog->create();
		switch_to_blog( $child );

		$post = self::factory()->post->create_and_get( array(
			'post_title' => 'Hello Child Blog',
		) );

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'maxwidth', 400 );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertInternalType( 'array', $data );
		$this->assertNotEmpty( $data );

		restore_current_blog();
	}

	function test_rest_pre_serve_request() {
		$user = $this->factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = $this->factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'format', 'xml' );

		$response = $this->server->dispatch( $request );
		$output   = get_echo( '_oembed_rest_pre_serve_request', array( true, $response, $request, $this->server ) );

		$xml = simplexml_load_string( $output );
		$this->assertInstanceOf( 'SimpleXMLElement', $xml );
	}

	function test_rest_pre_serve_request_wrong_format() {
		$post = $this->factory()->post->create_and_get();

		$request = new WP_REST_Request( 'GET', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'format', 'json' );

		$response = $this->server->dispatch( $request );

		$this->assertTrue( _oembed_rest_pre_serve_request( true, $response, $request, $this->server ) );
	}

	function test_rest_pre_serve_request_wrong_method() {
		$post = $this->factory()->post->create_and_get();

		$request = new WP_REST_Request( 'HEAD', '/oembed/1.0/embed' );
		$request->set_param( 'url', get_permalink( $post->ID ) );
		$request->set_param( 'format', 'xml' );

		$response = $this->server->dispatch( $request );

		$this->assertTrue( _oembed_rest_pre_serve_request( true, $response, $request, $this->server ) );
	}

	function test_get_oembed_endpoint_url() {
		$this->assertEquals( home_url() . '/?rest_route=/oembed/1.0/embed', get_oembed_endpoint_url() );
		$this->assertEquals( home_url() . '/?rest_route=/oembed/1.0/embed', get_oembed_endpoint_url( '', 'json' ) );
		$this->assertEquals( home_url() . '/?rest_route=/oembed/1.0/embed', get_oembed_endpoint_url( '', 'xml' ) );

		$post_id     = $this->factory()->post->create();
		$url         = get_permalink( $post_id );
		$url_encoded = urlencode( $url );

		$this->assertEquals( home_url() . '/?rest_route=%2Foembed%2F1.0%2Fembed&url=' . $url_encoded, get_oembed_endpoint_url( $url ) );
		$this->assertEquals( home_url() . '/?rest_route=%2Foembed%2F1.0%2Fembed&url=' . $url_encoded . '&format=xml', get_oembed_endpoint_url( $url, 'xml' ) );
	}

	function test_get_oembed_endpoint_url_pretty_permalinks() {
		update_option( 'permalink_structure', '/%postname%' );

		$this->assertEquals( home_url() . '/wp-json/oembed/1.0/embed', get_oembed_endpoint_url() );
		$this->assertEquals( home_url() . '/wp-json/oembed/1.0/embed', get_oembed_endpoint_url( '', 'xml' ) );

		$post_id     = $this->factory()->post->create();
		$url         = get_permalink( $post_id );
		$url_encoded = urlencode( $url );

		$this->assertEquals( home_url() . '/wp-json/oembed/1.0/embed?url=' . $url_encoded, get_oembed_endpoint_url( $url ) );
		$this->assertEquals( home_url() . '/wp-json/oembed/1.0/embed?url=' . $url_encoded . '&format=xml', get_oembed_endpoint_url( $url, 'xml' ) );

		update_option( 'permalink_structure', '' );
	}
}
