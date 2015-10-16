<?php

/**
 * @group oembed
 */
class Tests_Post_Embed_URL extends WP_UnitTestCase {
	function test_get_post_embed_url_non_existent_post() {
		$embed_url = get_post_embed_url( 0 );
		$this->assertFalse( $embed_url );
	}

	function test_get_post_embed_url_with_pretty_permalinks() {
		update_option( 'permalink_structure', '/%postname%' );

		$post_id   = self::$factory->post->create();
		$permalink = get_permalink( $post_id );
		$embed_url = get_post_embed_url( $post_id );

		$this->assertEquals( user_trailingslashit( trailingslashit( $permalink ) . 'embed' ), $embed_url );

		update_option( 'permalink_structure', '' );
	}

	function test_get_post_embed_url_with_ugly_permalinks() {
		$post_id   = self::$factory->post->create();
		$permalink = get_permalink( $post_id );
		$embed_url = get_post_embed_url( $post_id );

		$this->assertEquals( $permalink . '&embed=true', $embed_url );
	}
}
