<?php

/**
 * @group oembed
 */
class Tests_oEmbed_Discovery extends WP_UnitTestCase {
	function test_add_oembed_discovery_links_non_singular() {
		$this->assertSame( '', get_echo( 'wp_oembed_add_discovery_links' ) );
	}

	function test_add_oembed_discovery_links_front_page() {
		$this->go_to( home_url() );
		$this->assertSame( '', get_echo( 'wp_oembed_add_discovery_links' ) );
		$this->assertSame( 0, url_to_postid( home_url() ) );
	}

	/**
	 * @ticket 34971
	 */
	function test_add_oembed_discovery_links_static_front_page() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::factory()->post->create( array( 'post_title' => 'front-page', 'post_type' => 'page' ) ) );

		$this->go_to( home_url() );
		$this->assertQueryTrue( 'is_front_page', 'is_singular', 'is_page' );

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertSame( $expected, get_echo( 'wp_oembed_add_discovery_links' ) );

		update_option( 'show_on_front', 'posts' );
	}

	function test_add_oembed_discovery_links_to_post() {
		$post_id = self::factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );
		$this->assertQueryTrue( 'is_single', 'is_singular' );

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertEquals( $expected, get_echo( 'wp_oembed_add_discovery_links' ) );
	}

	function test_add_oembed_discovery_links_to_page() {
		$post_id = self::factory()->post->create( array(
			'post_type' => 'page'
		));
		$this->go_to( get_permalink( $post_id ) );
		$this->assertQueryTrue( 'is_page', 'is_singular' );

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertEquals( $expected, get_echo( 'wp_oembed_add_discovery_links' ) );
	}

	function test_add_oembed_discovery_links_to_attachment() {
		$post_id       = self::factory()->post->create();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
		) );

		$this->go_to( get_permalink( $attachment_id ) );
		$this->assertQueryTrue( 'is_attachment', 'is_singular', 'is_single' );

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertEquals( $expected, get_echo( 'wp_oembed_add_discovery_links' ) );
	}
}
