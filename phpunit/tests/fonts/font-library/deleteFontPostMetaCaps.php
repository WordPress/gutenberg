<?php
/**
 * Test gutenberg_delete_font_post_meta_caps().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers gutenberg_delete_font_post_meta_caps
 */
class Tests_Fonts_GutenbergDeleteFontPostMetaCaps extends WP_UnitTestCase {
	public function test_should_return_original_caps_when_do_not_allow_is_present() {
		$caps   = array( 'don_not_allow' );
		$result = gutenberg_delete_font_post_meta_caps( $caps, 'some_cap', 1, array( 999 ) );
		$this->assertSameSetsWithIndex( $caps, $result );
	}

	public function test_should_return_original_caps_if_not_delete_post_capability() {
		$caps   = array( 'my_capability' );
		$result = gutenberg_delete_font_post_meta_caps( $caps, 'some_cap', 1, array( 999 ) );
		$this->assertSameSetsWithIndex( $caps, $result );
	}

	public function test_should_add_do_not_allow_for_non_existent_post() {
		$caps   = array( 'my_capability' );
		$result = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( 999 ) );
		$this->assertContainsEquals( 'do_not_allow', $result );
	}

	public function test_should_return_original_caps_for_wp_font_face_posts_with_no_files() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'wp_font_face' ) );
		$result  = gutenberg_delete_font_post_meta_caps( array(), 'delete_post', 1, array( $post_id ) );
		$this->assertEquals( array(), $result, 'Capabilities should remain unchanged for "wp_font_face" post type without associated files.' );
	}

	public function test_should_include_upload_fonts_cap_for_font_post_types_with_files() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'wp_font_face' ) );
		add_post_meta( $post_id, '_wp_font_face_file', 'path/to/font/file' );
		$caps   = array();
		$result = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $post_id ) );
		$this->assertContainsEquals( 'upload_fonts', $result, 'Capabilities should include "upload_fonts" for "wp_font_face" post type with associated files.' );
	}

	public function test_should_return_original_caps_for_wp_font_family_posts_with_no_files() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'wp_font_family' ) );
		$caps    = array();
		$result  = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $post_id ) );
		$this->assertEquals( $caps, $result, 'Capabilities should remain unchanged for "wp_font_family" post type without associated font faces.' );
	}

	public function test_should_include_upload_fonts_cap_for_font_faces_types_with_files() {
		$font_family_post_id = $this->factory->post->create( array( 'post_type' => 'wp_font_family' ) );
		$font_face_post_id   = $this->factory->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => $font_family_post_id,
			)
		);
		add_post_meta( $font_face_post_id, '_wp_font_face_file', 'path/to/font/file' );

		$result = gutenberg_delete_font_post_meta_caps( array(), 'delete_post', 1, array( $font_family_post_id ) );
		$this->assertContains( 'upload_fonts', $result, 'Capabilities should include "upload_fonts" for "wp_font_family" post type with at least one associated font face having files.' );
	}

	public function test_should_return_original_caps_for_non_font_post_types() {
		$caps    = array( 'edit_posts' );
		$post_id = $this->factory->post->create( array( 'post_type' => 'post' ) );
		$result  = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $post_id ) );
		$this->assertEquals( $caps, $result, 'Capabilities should remain unchanged for non-font post types.' );
	}
}
