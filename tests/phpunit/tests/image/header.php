<?php
require_once( ABSPATH . 'wp-admin/custom-header.php');

/**
 * @group image
 * @group header
 */
class Tests_Image_Header extends WP_UnitTestCase {
	var $custom_image_header;

	function setUp() {
		parent::setUp();
		$this->custom_image_header = new Custom_Image_Header( '__return_null' );
	}

	function test_header_image_has_correct_dimensions_with_max_width() {
		global $_wp_theme_features;

		$_wp_theme_features['custom-header'][0]['max-width'] = 1600;
		$_wp_theme_features['custom-header'][0]['width'] = 1200;
		$_wp_theme_features['custom-header'][0]['height'] = 230;
		$_wp_theme_features['custom-header'][0]['flex-width'] = false;
		$_wp_theme_features['custom-header'][0]['flex-height'] = false;

		$dimensions = $this->custom_image_header->get_header_dimensions( array(
			'width' => 1600,
			'height' => 1200,
		) );
		$this->assertEquals( $dimensions['dst_width'], 1200);
		$this->assertEquals( $dimensions['dst_height'], 230);

	}

	function test_header_image_has_correct_dimensions_with_fixed() {
		global $_wp_theme_features;

		unset( $_wp_theme_features['custom-header'][0]['max-width'] );
		$_wp_theme_features['custom-header'][0]['width'] = 1200;
		$_wp_theme_features['custom-header'][0]['height'] = 230;
		$_wp_theme_features['custom-header'][0]['flex-width'] = false;
		$_wp_theme_features['custom-header'][0]['flex-height'] = false;

		$dimensions = $this->custom_image_header->get_header_dimensions( array(
			'width' => 1600,
			'height' => 1200,
		) );
		$this->assertEquals( $dimensions['dst_width'], 1200);
		$this->assertEquals( $dimensions['dst_height'], 230);

	}

	function test_header_image_has_correct_dimensions_with_flex_height() {
		global $_wp_theme_features;

		unset( $_wp_theme_features['custom-header'][0]['max-width'] );
		$_wp_theme_features['custom-header'][0]['width'] = 1200;
		$_wp_theme_features['custom-header'][0]['height'] = 230;
		$_wp_theme_features['custom-header'][0]['flex-width'] = false;
		$_wp_theme_features['custom-header'][0]['flex-height'] = true;

		$dimensions = $this->custom_image_header->get_header_dimensions( array(
			'width' => 1600,
			'height' => 1200,
		) );
		$this->assertEquals( $dimensions['dst_width'], 1200);
		$this->assertEquals( $dimensions['dst_height'], 900);

	}

	function test_header_image_has_correct_dimensions_with_flex_width() {
		global $_wp_theme_features;

		unset( $_wp_theme_features['custom-header'][0]['max-width'] );
		$_wp_theme_features['custom-header'][0]['width'] = 1200;
		$_wp_theme_features['custom-header'][0]['height'] = 230;
		$_wp_theme_features['custom-header'][0]['flex-width'] = true;
		$_wp_theme_features['custom-header'][0]['flex-height'] = false;

		$dimensions = $this->custom_image_header->get_header_dimensions( array(
			'width' => 1600,
			'height' => 1200,
		) );
		$this->assertEquals( $dimensions['dst_width'], 1500); // max width
		$this->assertEquals( $dimensions['dst_height'], 230);

	}

	function test_header_image_has_correct_dimensions_with_flex_width_and_height() {
		global $_wp_theme_features;

		$_wp_theme_features['custom-header'][0]['max-width'] = 1800;
		$_wp_theme_features['custom-header'][0]['width'] = 1200;
		$_wp_theme_features['custom-header'][0]['height'] = 230;
		$_wp_theme_features['custom-header'][0]['flex-width'] = true;
		$_wp_theme_features['custom-header'][0]['flex-height'] = true;

		$dimensions = $this->custom_image_header->get_header_dimensions( array(
			'width' => 1600,
			'height' => 1200,
		) );
		$this->assertEquals( $dimensions['dst_width'], 1600);
		$this->assertEquals( $dimensions['dst_height'], 1200);

	}

	function test_create_attachment_object() {
		global $custom_image_header;

		$id = wp_insert_attachment( array(
			'post_status' => 'publish',
			'post_title' => 'foo.png',
			'post_type' => 'post',
			'guid' => 'http://localhost/foo.png'
		) );

		$cropped = 'http://localhost/foo-cropped.png';

		$object = $this->custom_image_header->create_attachment_object( $cropped, $id );
		$this->assertEquals( $object['post_title'], 'foo-cropped.png' );
		$this->assertEquals( $object['guid'], $cropped );
		$this->assertEquals( $object['context'], 'custom-header' );
		$this->assertEquals( $object['post_mime_type'], 'image/jpeg' );
		$this->assertEquals( $object['post_content'], $cropped );
	}

	function test_insert_cropped_attachment() {
		global $custom_image_header;

		$id = wp_insert_attachment( array(
			'post_status' => 'publish',
			'post_title' => 'foo.png',
			'post_type' => 'post',
			'guid' => 'http://localhost/foo.png'
		) );

		$cropped = 'http://localhost/foo-cropped.png';
		$object = $this->custom_image_header->create_attachment_object( $cropped, $id );

		$cropped_id = $this->custom_image_header->insert_attachment( $object, $cropped );

		$this->assertInternalType( 'int', $cropped_id );
		$this->assertGreaterThan( 0, $cropped_id );
	}

}
