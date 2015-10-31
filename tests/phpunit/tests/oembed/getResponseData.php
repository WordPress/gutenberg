<?php

/**
 * @group oembed
 */
class Tests_oEmbed_Response_Data extends WP_UnitTestCase {
	function test_get_oembed_response_data_non_existent_post() {
		$this->assertFalse( get_oembed_response_data( 0, 100 ) );
	}

	function test_get_oembed_response_data() {
		$post = self::factory()->post->create_and_get( array(
			'post_title' => 'Some Post',
		) );

		$data = get_oembed_response_data( $post, 400 );

		$this->assertEqualSets( array(
			'version'       => '1.0',
			'provider_name' => get_bloginfo( 'name' ),
			'provider_url'  => get_home_url( '/' ),
			'author_name'   => get_bloginfo( 'name' ),
			'author_url'    => get_home_url( '/' ),
			'title'         => 'Some Post',
			'type'          => 'rich',
			'width'         => 400,
			'height'        => 225,
			'html'          => get_post_embed_html( 400, 225, $post ),
		), $data );
	}

	/**
	 * Test get_oembed_response_data with an author.
	 */
	function test_get_oembed_response_data_author() {
		$user_id = self::factory()->user->create( array(
			'display_name' => 'John Doe',
		) );

		$post = self::factory()->post->create_and_get( array(
			'post_title'  => 'Some Post',
			'post_author' => $user_id,
		) );

		$data = get_oembed_response_data( $post, 400 );

		$this->assertEqualSets( array(
			'version'       => '1.0',
			'provider_name' => get_bloginfo( 'name' ),
			'provider_url'  => get_home_url( '/' ),
			'author_name'   => 'John Doe',
			'author_url'    => get_author_posts_url( $user_id ),
			'title'         => 'Some Post',
			'type'          => 'rich',
			'width'         => 400,
			'height'        => 225,
			'html'          => get_post_embed_html( 400, 225, $post ),
		), $data );
	}

	function test_get_oembed_response_link() {
		remove_filter( 'oembed_response_data', 'get_oembed_response_data_rich' );

		$post = self::factory()->post->create_and_get( array(
			'post_title' => 'Some Post',
		) );

		$data = get_oembed_response_data( $post, 600 );

		$this->assertEqualSets( array(
			'version'       => '1.0',
			'provider_name' => get_bloginfo( 'name' ),
			'provider_url'  => get_home_url( '/' ),
			'author_name'   => get_bloginfo( 'name' ),
			'author_url'    => get_home_url( '/' ),
			'title'         => 'Some Post',
			'type'          => 'link',
		), $data );

		add_filter( 'oembed_response_data', 'get_oembed_response_data_rich', 10, 4 );
	}

	function test_get_oembed_response_data_with_draft_post() {
		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'draft',
		) );

		$this->assertFalse( get_oembed_response_data( $post, 100 ) );
	}

	function test_get_oembed_response_data_with_scheduled_post() {
		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'future',
			'post_date'   => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) ),
		) );

		$this->assertFalse( get_oembed_response_data( $post, 100 ) );
	}

	function test_get_oembed_response_data_with_private_post() {
		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'private',
		) );

		$this->assertFalse( get_oembed_response_data( $post, 100 ) );
	}

	function test_get_oembed_response_data_maxwidth_too_high() {
		$post = self::factory()->post->create_and_get();

		$data = get_oembed_response_data( $post, 1000 );

		$this->assertEquals( 600, $data['width'] );
		$this->assertEquals( 338, $data['height'] );
	}

	function test_get_oembed_response_data_maxwidth_too_low() {
		$post = self::factory()->post->create_and_get();

		$data = get_oembed_response_data( $post, 100 );

		$this->assertEquals( 200, $data['width'] );
		$this->assertEquals( 200, $data['height'] );
	}

	function test_get_oembed_response_data_maxwidth_invalid() {
		$post = self::factory()->post->create_and_get();

		$data = get_oembed_response_data( $post, '400;" DROP TABLES' );

		$this->assertEquals( 400, $data['width'] );
		$this->assertEquals( 225, $data['height'] );

		$data = get_oembed_response_data( $post, "lol this isn't even a number?!?!?" );

		$this->assertEquals( 200, $data['width'] );
		$this->assertEquals( 200, $data['height'] );
	}

	function test_get_oembed_response_data_with_thumbnail() {
		$post          = self::factory()->post->create_and_get();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_object( $file, $post->ID, array(
			'post_mime_type' => 'image/jpeg',
		) );
		set_post_thumbnail( $post, $attachment_id );

		$data = get_oembed_response_data( $post, 400 );

		$this->assertArrayHasKey( 'thumbnail_url', $data );
		$this->assertArrayHasKey( 'thumbnail_width', $data );
		$this->assertArrayHasKey( 'thumbnail_height', $data );
		$this->assertTrue( 400 >= $data['thumbnail_width'] );
	}

	function test_get_oembed_response_data_for_attachment() {
		$parent = self::factory()->post->create();
		$file   = DIR_TESTDATA . '/images/canola.jpg';
		$post   = self::factory()->attachment->create_object( $file, $parent, array(
			'post_mime_type' => 'image/jpeg',
		) );

		$data = get_oembed_response_data( $post, 400 );

		$this->assertArrayHasKey( 'thumbnail_url', $data );
		$this->assertArrayHasKey( 'thumbnail_width', $data );
		$this->assertArrayHasKey( 'thumbnail_height', $data );
		$this->assertTrue( 400 >= $data['thumbnail_width'] );
	}
}
