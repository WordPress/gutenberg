<?php

/**
 * @group oembed
 */
class Tests_Post_Embed_URL extends WP_UnitTestCase {
	function test_non_existent_post() {
		$embed_url = get_post_embed_url( 0 );
		$this->assertFalse( $embed_url );
	}

	function test_with_pretty_permalinks() {
		$this->set_permalink_structure( '/%postname%' );

		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );
		$embed_url = get_post_embed_url( $post_id );

		$this->assertEquals( $permalink . '/embed', $embed_url );
	}

	function test_with_ugly_permalinks() {
		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );
		$embed_url = get_post_embed_url( $post_id );

		$this->assertEquals( $permalink . '&embed=true', $embed_url );
	}

	/**
	 * @ticket 34971
	 */
	function test_static_front_page() {
		$this->set_permalink_structure( '/%postname%/' );

		$post_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		$embed_url = get_post_embed_url( $post_id );

		$this->assertSame( user_trailingslashit( trailingslashit( home_url() ) . 'embed' ), $embed_url );

		update_option( 'show_on_front', 'posts' );
	}

	/**
	 * @ticket 34971
	 */
	function test_static_front_page_with_ugly_permalinks() {
		$post_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		$embed_url = get_post_embed_url( $post_id );

		$this->assertSame( trailingslashit( home_url() ) . '?embed=true', $embed_url );

		update_option( 'show_on_front', 'posts' );
	}

	/**
	 * @ticket 34971
	 */
	function test_page_conflicts_with_embed_slug() {
		$this->set_permalink_structure( '/%postname%/' );

		$parent_page = self::factory()->post->create( array( 'post_type' => 'page' ) );

		add_filter( 'wp_unique_post_slug', array( $this, 'filter_unique_post_slug' ) );
		$child_page = self::factory()->post->create( array(
			'post_type'   => 'page',
			'post_parent' => $parent_page,
			'post_name'   => 'embed',
		) );
		remove_filter( 'wp_unique_post_slug', array( $this, 'filter_unique_post_slug' ) );

		$this->assertSame( get_permalink( $parent_page ) . '?embed=true', get_post_embed_url( $parent_page ) );
		$this->assertSame( get_permalink( $child_page ) . 'embed/', get_post_embed_url( $child_page ) );
	}

	/**
	 * @ticket 34971
	 */
	function test_static_front_page_conflicts_with_embed_slug() {
		$this->set_permalink_structure( '/%postname%/' );

		// Create a post with the 'embed' post_name
		add_filter( 'wp_unique_post_slug', array( $this, 'filter_unique_post_slug' ) );
		$post_embed_slug = self::factory()->post->create( array( 'post_name' => 'embed' ) );
		remove_filter( 'wp_unique_post_slug', array( $this, 'filter_unique_post_slug' ) );
		$page_front = self::factory()->post->create( array( 'post_type' => 'page' ) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_front );

		$this->assertSame( home_url() . '/embed/embed/', get_post_embed_url( $post_embed_slug ) );
		$this->assertSame( home_url() . '/?embed=true', get_post_embed_url( $page_front ) );

		update_option( 'show_on_front', 'posts' );
	}

	public function filter_unique_post_slug() {
		return 'embed';
	}
}
