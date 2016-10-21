<?php

/**
 * @group post
 * @group ping
 */
class Tests_Ping_and_Trackback_Sending extends WP_UnitTestCase {

	public function test_returns_to_ping_sites_from_post_id() {
		$post_id = self::factory()->post->create( array( 'to_ping' => 'http://www.example.com
					http://www.otherexample.com' ) );
		$this->assertSame( array( 'http://www.example.com', 'http://www.otherexample.com' ), get_to_ping( $post_id ) );
	}

	public function test_returns_to_ping_sites_from_post_object() {
		$post_id = self::factory()->post->create( array( 'to_ping' => 'http://www.example.com
					http://www.otherexample.com' ) );
		$post = get_post( $post_id );
		$this->assertSame( array( 'http://www.example.com', 'http://www.otherexample.com' ), get_to_ping( $post ) );
	}

	public function test_returns_pinged_sites_from_post_id() {
		$post_id = self::factory()->post->create( array( 'pinged' => 'foo bar baz' ) );
		$this->assertSame( array( 'foo', 'bar', 'baz' ), get_pung( $post_id ) );
	}

	public function test_returns_pinged_sites_from_post_object() {
		$post_id = self::factory()->post->create( array( 'pinged' => 'foo bar baz' ) );
		$post = get_post( $post_id );
		$this->assertSame( array( 'foo', 'bar', 'baz' ), get_pung( $post ) );
	}

	public function test_add_ping_with_post_id() {
		$post_id = self::factory()->post->create();
		add_ping( $post_id, 'foo' );
		add_ping( $post_id, 'bar' );
		add_ping( $post_id, 'baz' );
		$this->assertSame( array( 'foo', 'bar', 'baz' ), get_pung( $post_id ) );
	}

	public function test_add_ping_array_with_post_id() {
		$post_id = self::factory()->post->create();
		add_ping( $post_id, array( 'foo', 'bar', 'baz' ) );
		$this->assertSame( array( 'foo', 'bar', 'baz' ), get_pung( $post_id ) );
	}

	public function test_add_ping_with_post_object() {
		$post_id = self::factory()->post->create();
		$post = get_post( $post_id );
		add_ping( $post, 'foo' );
		$this->assertSame( array( 'foo' ), get_pung( $post_id ) );
	}
}
