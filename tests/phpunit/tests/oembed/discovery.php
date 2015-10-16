<?php

/**
 * @group oembed
 */
class Tests_oEmbed_Discovery extends WP_UnitTestCase {
	function test_add_oembed_discovery_links_non_singular() {
		ob_start();
		wp_oembed_add_discovery_links();
		$actual = ob_get_clean();
		$this->assertSame( '', $actual );
	}

	function test_add_oembed_discovery_links_to_post() {
		$post_id = self::$factory->post->create();
		$this->go_to( get_permalink( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular' );

		ob_start();
		wp_oembed_add_discovery_links();
		$actual = ob_get_clean();

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertEquals( $expected, $actual );
	}

	function test_add_oembed_discovery_links_to_page() {
		$post_id = self::$factory->post->create( array(
			'post_type' => 'page'
		));
		$this->go_to( get_permalink( $post_id ) );

		$this->assertQueryTrue( 'is_page', 'is_singular' );

		ob_start();
		wp_oembed_add_discovery_links();
		$actual = ob_get_clean();

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertEquals( $expected, $actual );
	}

	function test_add_oembed_discovery_links_to_attachment() {
		$post_id       = self::$factory->post->create();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::$factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
		) );

		$this->go_to( get_permalink( $attachment_id ) );

		$this->assertQueryTrue( 'is_attachment', 'is_singular', 'is_single' );

		ob_start();
		wp_oembed_add_discovery_links();
		$actual = ob_get_clean();

		$expected = '<link rel="alternate" type="application/json+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink() ) ) . '" />' . "\n";
		$expected .= '<link rel="alternate" type="text/xml+oembed" href="' . esc_url( get_oembed_endpoint_url( get_permalink(), 'xml' ) ) . '" />' . "\n";

		$this->assertEquals( $expected, $actual );
	}
}
