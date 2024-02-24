<?php
/**
 * Test gutenberg_maybe_grant_upload_font_cap().
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers gutenberg_maybe_grant_upload_font_cap
 */
class Tests_Fonts_GutenbergMaybeGrantUploadFontCap extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
	}

	public function tear_down() {
		parent::tear_down();
	}

	// Test non-font post types should return original capabilities
	public function testNonFontPostType() {
		$caps       = array( 'edit_posts' ); // Example of original capabilities
		$resultCaps = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( 999 ) ); // Assuming 999 is a non-font post ID

		$this->assertEquals( $caps, $resultCaps, 'Capabilities should remain unchanged for non-font post types.' );
	}

	// Test non-existent posts should add 'do_not_allow' capability
	public function testNonExistentPost() {
		$caps       = array(); // Original capabilities
		$resultCaps = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( 999 ) ); // Assuming 999 is a non-existent post ID

		$this->assertContains( 'do_not_allow', $resultCaps, 'Capabilities should contain "do_not_allow" for non-existent posts.' );
	}

	// Test 'wp_font_face' post type without associated files
	public function testFontFacePostTypeWithoutFiles() {
		$postId = $this->factory->post->create( array( 'post_type' => 'wp_font_face' ) ); // Create a font face post
		// No font files are associated in this test case

		$caps       = array(); // Original capabilities
		$resultCaps = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $postId ) );

		$this->assertEquals( $caps, $resultCaps, 'Capabilities should remain unchanged for "wp_font_face" post type without associated files.' );
	}

	// Test 'wp_font_face' post type with associated files requires 'upload_fonts' capability
	public function testFontFacePostTypeWithFiles() {
		$postId = $this->factory->post->create( array( 'post_type' => 'wp_font_face' ) );
		add_post_meta( $postId, '_wp_font_face_file', 'path/to/font/file' ); // Simulate associated font file

		$caps       = array(); // Original capabilities
		$resultCaps = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $postId ) );

		$this->assertContains( 'upload_fonts', $resultCaps, 'Capabilities should include "upload_fonts" for "wp_font_face" post type with associated files.' );
	}

	// Test 'wp_font_family' post type without associated font faces
	public function testFontFamilyPostTypeWithoutFontFaces() {
		$postId = $this->factory->post->create( array( 'post_type' => 'wp_font_family' ) ); // Create a font family post
		// No font faces are associated in this test case

		$caps       = array(); // Original capabilities
		$resultCaps = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $postId ) );

		$this->assertEquals( $caps, $resultCaps, 'Capabilities should remain unchanged for "wp_font_family" post type without associated font faces.' );
	}

	// Test 'wp_font_family' post type with at least one font face having files requires 'upload_fonts' capability
	public function testFontFamilyPostTypeWithFontFacesHavingFiles() {
		$familyPostId = $this->factory->post->create( array( 'post_type' => 'wp_font_family' ) );
		$facePostId   = $this->factory->post->create(
			array(
				'post_type'   => 'wp_font_face',
				'post_parent' => $familyPostId,
			)
		);
		add_post_meta( $facePostId, '_wp_font_face_file', 'path/to/font/file' ); // Simulate associated font file with one of the font faces

		$caps       = array(); // Original capabilities
		$resultCaps = gutenberg_delete_font_post_meta_caps( $caps, 'delete_post', 1, array( $familyPostId ) );

		$this->assertContains( 'upload_fonts', $resultCaps, 'Capabilities should include "upload_fonts" for "wp_font_family" post type with at least one associated font face having files.' );
	}
}
