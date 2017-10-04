<?php
/**
 * Automatic paragraph applicatino tests
 *
 * @package Gutenberg
 */

class WPAutoP_Test extends WP_UnitTestCase {
	function test_gutenberg_wpautop_block_content() {
		$original_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/wpautop-original.html' );
		$expected_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/wpautop-expected.html' );

		$actual_html = gutenberg_wpautop_block_content( $original_html );

		$this->assertEquals( $expected_html, $actual_html );
	}

	function test_gutenberg_wpautop_insert_post_data() {
		$original_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/wpautop-original.html' );
		$expected_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/wpautop-expected.html' );

		$post_id = self::factory()->post->create( array(
			'post_title'   => 'Example',
			'post_content' => $original_html,
		) );

		$post = get_post( $post_id );

		$this->assertEquals( $expected_html, $post->post_content );
	}
}
