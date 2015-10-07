<?php

/**
 * @group oembed
 */
class Tests_Embed_Template extends WP_UnitTestCase {
	function test_oembed_output_post() {
		$user = $this->factory->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );

		$post_id = $this->factory->post->create( array(
			'post_author'  => $user->ID,
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
		) );
		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertTrue( false === strpos( $actual, 'Page not found' ) );
		$this->assertTrue( false !== strpos( $actual, 'Hello World' ) );
	}

	function test_oembed_output_post_with_thumbnail() {
		$post_id       = $this->factory->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
		) );
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
		) );
		set_post_thumbnail( $post_id, $attachment_id );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertFalse( strpos( $actual, 'Page not found' ) );
		$this->assertTrue( false !== strpos( $actual, 'Hello World' ) );
		$this->assertTrue( false !== strpos( $actual, 'canola.jpg' ) );
	}

	function test_oembed_output_404() {
		$this->go_to( home_url( '/?p=123&embed=true' ) );
		$GLOBALS['wp_query']->query_vars['embed'] = true;

		$this->assertQueryTrue( 'is_404' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertTrue( false !== strpos( $actual, 'Page not found' ) );
	}

	function test_oembed_output_attachment() {
		$post          = $this->factory->post->create_and_get();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = $this->factory->attachment->create_object( $file, $post->ID, array(
			'post_mime_type' => 'image/jpeg',
			'post_title'     => 'Hello World',
			'post_content'   => 'Foo Bar',
			'post_excerpt'   => 'Bar Baz',
		) );

		$this->go_to( get_post_embed_url( $attachment_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular', 'is_attachment' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertFalse( strpos( $actual, 'Page not found' ) );
		$this->assertTrue( false !== strpos( $actual, 'Hello World' ) );
		$this->assertTrue( false !== strpos( $actual, 'canola.jpg' ) );
	}

	function test_oembed_output_draft_post() {
		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'draft',
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_404' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertTrue( false !== strpos( $actual, 'Page not found' ) );
	}

	function test_oembed_output_scheduled_post() {
		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'future',
			'post_date'    => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) ),
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_404' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertTrue( false !== strpos( $actual, 'Page not found' ) );
	}

	function test_oembed_output_private_post() {
		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'private',
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_404' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertTrue( false !== strpos( $actual, 'Page not found' ) );
	}

	function test_oembed_output_private_post_with_permissions() {
		$user_id = $this->factory->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'private',
			'post_author'  => $user_id,
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		ob_start();
		include( ABSPATH . WPINC . '/embed-template.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertTrue( false === strpos( $actual, 'Page not found' ) );
		$this->assertTrue( false !== strpos( $actual, 'Hello World' ) );
	}

	function test_wp_oembed_excerpt_more_no_embed() {
		$GLOBALS['wp_query'] = new WP_Query();

		$this->assertEquals( 'foo bar', wp_oembed_excerpt_more( 'foo bar' ) );
	}

	function test_wp_oembed_excerpt_more() {
		$post_id = $this->factory->post->create( array(
			'post_content' => 'Foo Bar',
		) );

		$this->assertEquals( '', wp_oembed_excerpt_more( '' ) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$actual = wp_oembed_excerpt_more( '' );

		$expected = sprintf(
			'&hellip; <a class="wp-embed-more" href="%s" target="_top">Read more</a>',
			get_the_permalink()
		);

		$this->assertEquals( $expected, $actual );
	}

	function test_is_embed_post() {
		$this->assertFalse( is_embed() );

		$post_id = $this->factory->post->create();
		$this->go_to( get_post_embed_url( $post_id ) );
		$this->assertTrue( is_embed() );
	}

	function test_is_embed_attachment() {
		$post_id       = $this->factory->post->create();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
		) );
		$this->go_to( get_post_embed_url( $attachment_id ) );
		$this->assertTrue( is_embed() );
	}

	function test_is_embed_404() {
		$this->go_to( home_url( '/?p=12345&embed=true' ) );
		$this->assertTrue( is_embed() );
	}

	function test_get_post_embed_html_non_existent_post() {
		$this->assertFalse( get_post_embed_html( 0, 200, 200 ) );
		$this->assertFalse( get_post_embed_html( null, 200, 200 ) );
	}

	function test_get_post_embed_html() {
		$post_id = $this->factory->post->create();

		$expected = '<iframe sandbox="allow-scripts" security="restricted" src="' . esc_url( get_post_embed_url( $post_id ) ) . '" width="200" height="200" title="Embedded WordPress Post" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" class="wp-embedded-content"></iframe>';

		$this->assertStringEndsWith( $expected, get_post_embed_html( $post_id, 200, 200 ) );
	}

	function test_add_host_js() {
		ob_start();
		wp_oembed_add_host_js();
		ob_end_clean();

		$this->assertTrue( wp_script_is( 'wp-oembed' ) );
	}
}
