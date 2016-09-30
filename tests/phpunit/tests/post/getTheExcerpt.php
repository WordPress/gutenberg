<?php

/**
 * @group post
 * @group formatting
 */
class Tests_Post_GetTheExcerpt extends WP_UnitTestCase {

	/**
	 * @ticket 27246
	 */
	public function test_the_excerpt_invalid_post() {
		$this->assertSame( '', get_echo( 'the_excerpt' ) );
		$this->assertSame( '', get_the_excerpt() );
	}

	/**
	 * @ticket 27246
	 * @expectedDeprecated get_the_excerpt
	 */
	public function test_the_excerpt_deprecated() {
		$this->assertSame( '', get_the_excerpt( true ) );
		$this->assertSame( '', get_the_excerpt( false ) );
	}

	/**
	 * @ticket 27246
	 */
	public function test_the_excerpt() {
		$GLOBALS['post'] = self::factory()->post->create_and_get( array( 'post_excerpt' => 'Post excerpt' ) );
		$this->assertSame( "<p>Post excerpt</p>\n", get_echo( 'the_excerpt' ) );
		$this->assertSame( 'Post excerpt', get_the_excerpt() );
	}

	/**
	 * @ticket 27246
	 * @ticket 35486
	 */
	public function test_the_excerpt_password_protected_post() {
		$post = self::factory()->post->create_and_get( array( 'post_excerpt' => 'Post excerpt', 'post_password' => '1234' ) );
		$this->assertSame( 'There is no excerpt because this is a protected post.', get_the_excerpt( $post ) );

		$GLOBALS['post'] = $post;
		$this->assertSame( "<p>There is no excerpt because this is a protected post.</p>\n", get_echo( 'the_excerpt' ) );
	}

	/**
	 * @ticket 27246
	 */
	public function test_the_excerpt_specific_post() {
		$GLOBALS['post'] = self::factory()->post->create_and_get( array( 'post_excerpt' => 'Foo' ) );
		$post_id = self::factory()->post->create( array( 'post_excerpt' => 'Bar' ) );
		$this->assertSame( 'Bar', get_the_excerpt( $post_id ) );
	}
}
