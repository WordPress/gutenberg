<?php

/**
 * @group oembed
 */
class Test_oEmbed_Controller extends WP_UnitTestCase {
	function test_request_with_bad_url() {
		$request = array(
			'url'      => '',
			'format'   => 'json',
			'maxwidth' => 600,
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$this->assertEquals( 'Invalid URL.', $legacy_controller->dispatch( $request ) );
	}

	function test_request_json() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = self::factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		// WP_Query arguments.
		$request = array(
			'url'	  => get_permalink( $post->ID ),
			'format'   => 'json',
			'maxwidth' => 400,
			'callback' => '',
			'oembed'   => true,
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$data = json_decode( $legacy_controller->dispatch( $request ), true );

		$this->assertTrue( is_array( $data ) );

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

	function test_request_jsonp() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = self::factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		$request = array(
			'url'	  => get_permalink( $post->ID ),
			'format'   => 'json',
			'maxwidth' => 600,
			'callback' => 'mycallback',
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$data = $legacy_controller->dispatch( $request );

		$this->assertEquals( 0, strpos( $data, '/**/mycallback(' ) );
	}

	function test_request_jsonp_invalid_callback() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = self::factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		$request = array(
			'url'	  => get_permalink( $post->ID ),
			'format'   => 'json',
			'maxwidth' => 600,
			'callback' => array( 'foo', 'bar' ),
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$data = $legacy_controller->dispatch( $request );

		$this->assertFalse( strpos( $data, '/**/' ) );
	}

	function test_request_json_invalid_data() {
		$request = array(
			'callback' => '',
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$this->assertEquals( 'Not implemented',  $legacy_controller->json_response( null, $request ) );
		$this->assertEquals( 'Not implemented',  $legacy_controller->json_response( 123, $request ) );
		$this->assertEquals( 'Not implemented',  $legacy_controller->json_response( array(), $request ) );
	}

	function test_request_xml() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );
		$post = self::factory()->post->create_and_get( array(
			'post_author' => $user->ID,
			'post_title'  => 'Hello World',
		) );

		$request = array(
			'url'	  => get_permalink( $post->ID ),
			'format'   => 'xml',
			'maxwidth' => 400,
			'callback' => '',
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$data = $legacy_controller->dispatch( $request );

		$data = simplexml_load_string( $data );
		$this->assertInstanceOf( 'SimpleXMLElement', $data );

		$data = (array) $data;

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

	function test_request_xml_invalid_data() {
		$legacy_controller = new WP_oEmbed_Controller();

		$this->assertEquals( 'Not implemented',  $legacy_controller->xml_response( null ) );
		$this->assertEquals( 'Not implemented',  $legacy_controller->xml_response( 123 ) );
		$this->assertEquals( 'Not implemented',  $legacy_controller->xml_response( array() ) );
	}

	/**
	 * @group multisite
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

		$request = array(
			'url'      => get_permalink( $post->ID ),
			'format'   => 'json',
			'maxwidth' => 600,
			'callback' => '',
		);

		$legacy_controller = new WP_oEmbed_Controller();

		$data = json_decode( $legacy_controller->dispatch( $request ), true );

		$this->assertInternalType( 'array', $data );
		$this->assertNotEmpty( $data );

		restore_current_blog();
	}

	function test_get_oembed_endpoint_url() {
		$this->assertEquals( home_url() . '/?oembed=true', get_oembed_endpoint_url() );
		$this->assertEquals( home_url() . '/?oembed=true', get_oembed_endpoint_url( '', 'json' ) );
		$this->assertEquals( home_url() . '/?oembed=true', get_oembed_endpoint_url( '', 'xml' ) );

		$post_id     = self::factory()->post->create();
		$url         = get_permalink( $post_id );
		$url_encoded = urlencode( $url );

		$this->assertEquals( home_url() . '/?oembed=true&url=' . $url_encoded, get_oembed_endpoint_url( $url ) );
		$this->assertEquals( home_url() . '/?oembed=true&url=' . $url_encoded . '&format=xml', get_oembed_endpoint_url( $url, 'xml' ) );
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
}
