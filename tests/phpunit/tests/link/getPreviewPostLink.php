<?php
/**
 * @group link
 * @covers ::get_preview_post_link
 */
class Tests_Link_GetPreviewPostLink extends WP_UnitTestCase {

	public function test_get_preview_post_link() {
		$post = self::factory()->post->create();

		$this->assertEquals( add_query_arg( 'preview', 'true', get_permalink( $post ) ), get_preview_post_link( $post) );
	}

	public function test_get_preview_post_link_should_add_additional_query_vars() {
		$post = self::factory()->post->create();

		$expected = add_query_arg( array(
			'foo'     => 'bar',
			'bar'     => 'baz',
			'preview' => 'true',
		), get_permalink( $post ) );

		$this->assertEquals( $expected, get_preview_post_link( $post, array(
			'foo' => 'bar',
			'bar' => 'baz',
		) ) );
	}

	public function test_get_preview_post_link_should_use_custom_base_preview_link() {
		$post = self::factory()->post->create();

		$expected = 'https://google.com/?foo=bar&bar=baz&preview=true';

		$this->assertEquals( $expected, get_preview_post_link( $post, array(
			'foo' => 'bar',
			'bar' => 'baz',
		), 'https://google.com/' ) );
	}

	public function test_get_preview_post_link_should_return_null_for_non_existent_post() {
		$this->assertNull( get_preview_post_link() );
		$this->assertNull( get_preview_post_link( 9999 ) );
		$this->assertNull( get_preview_post_link( 'foo' ) );
	}

	public function test_get_preview_post_link_for_global_post() {
		$post = self::factory()->post->create_and_get();

		$GLOBALS['post'] = $post;

		$this->assertEquals( add_query_arg( 'preview', 'true', get_permalink( $post ) ), get_preview_post_link() );
	}

	public function test_get_preview_post_link_should_return_empty_string_for_non_viewable_post_type() {
		$post_type = register_post_type( 'non_viewable_cpt', array(
			'public' => false,
		) );

		$post = self::factory()->post->create( array(
			'post_type' => $post_type->name
		) );

		$this->assertSame( '', get_preview_post_link( $post ) );
	}

}
