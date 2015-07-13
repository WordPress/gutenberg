<?php

/**
 * A set of unit tests for functions in wp-includes/general-template.php
 *
 * @group template
 */
class Tests_General_Template extends WP_UnitTestCase {

	public $wp_site_icon;
	public $site_icon_id;
	public $site_icon_url;

	function setUp() {
		parent::setUp();

		require_once ABSPATH . 'wp-admin/includes/class-wp-site-icon.php';
		$this->wp_site_icon = $GLOBALS['wp_site_icon'];
	}

	/**
	 * @group site_icon
	 */
	function test_get_site_icon_url() {
		$this->assertEmpty( get_site_icon_url() );

		$this->_set_site_icon();
		$this->assertEquals( $this->site_icon_url, get_site_icon_url() );

		$this->_remove_site_icon();
		$this->assertEmpty( get_site_icon_url() );
	}

	/**
	 * @group site_icon
	 */
	function test_site_icon_url() {
		$this->expectOutputString( '' );
		site_icon_url();

		$this->_set_site_icon();
		$this->expectOutputString( $this->site_icon_url );
		site_icon_url();
		$this->_remove_site_icon();
	}

	/**
	 * @group site_icon
	 */
	function test_has_site_icon() {
		$this->assertFalse( has_site_icon() );

		$this->_set_site_icon();
		$this->assertTrue( has_site_icon() );

		$this->_remove_site_icon();
		$this->assertFalse( has_site_icon() );
	}

	/**
	 * @group site_icon
	 */
	function test_wp_site_icon() {
		$this->expectOutputString( '' );
		wp_site_icon();

		$this->_set_site_icon();
		$output = array(
			sprintf( '<link rel="icon" href="%s" sizes="32x32" />', esc_url( get_site_icon_url( null, 32 ) ) ),
			sprintf( '<link rel="icon" href="%s" sizes="192x192" />', esc_url( get_site_icon_url( null, 192 ) ) ),
			sprintf( '<link rel="apple-touch-icon-precomposed" href="%s">', esc_url( get_site_icon_url( null, 180 ) ) ),
			sprintf( '<meta name="msapplication-TileImage" content="%s">', esc_url( get_site_icon_url( null, 270 ) ) ),
			'',
		);
		$output = implode( "\n", $output );

		$this->expectOutputString( $output );
		wp_site_icon();

		$this->_remove_site_icon();
	}

	/**
	 * @group site_icon
	 */
	function test_wp_site_icon_with_filter() {
		$this->expectOutputString( '' );
		wp_site_icon();

		$this->_set_site_icon();
		$output = array(
			sprintf( '<link rel="icon" href="%s" sizes="32x32" />', esc_url( get_site_icon_url( null, 32 ) ) ),
			sprintf( '<link rel="icon" href="%s" sizes="192x192" />', esc_url( get_site_icon_url( null, 192 ) ) ),
			sprintf( '<link rel="apple-touch-icon-precomposed" href="%s">', esc_url( get_site_icon_url( null, 180 ) ) ),
			sprintf( '<meta name="msapplication-TileImage" content="%s">', esc_url( get_site_icon_url( null, 270 ) ) ),
			sprintf( '<link rel="apple-touch-icon" sizes="150x150" href="%s">', esc_url( get_site_icon_url( null, 150 ) ) ),
			'',
		);
		$output = implode( "\n", $output );

		$this->expectOutputString( $output );
		add_filter( 'site_icon_meta_tags', array( $this, '_custom_site_icon_meta_tag' ) );
		wp_site_icon();
		remove_filter( 'site_icon_meta_tags', array( $this, '_custom_site_icon_meta_tag' ) );

		$this->_remove_site_icon();
	}

	function _custom_site_icon_meta_tag( $meta_tags ) {
		$meta_tags[] = sprintf( '<link rel="apple-touch-icon" sizes="150x150" href="%s">', esc_url( get_site_icon_url( null, 150 ) ) );

		return $meta_tags;
	}

	function _set_site_icon() {
		if ( ! $this->site_icon_id ) {
			add_filter( 'intermediate_image_sizes_advanced', array( $this->wp_site_icon, 'additional_sizes' ) );
			$this->_insert_attachment();
			remove_filter( 'intermediate_image_sizes_advanced', array( $this->wp_site_icon, 'additional_sizes' ) );
		}

		update_option( 'site_icon', $this->site_icon_id );
	}

	function _remove_site_icon() {
		delete_option( 'site_icon' );
	}

	function _insert_attachment() {
		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$type   = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => $upload['url'],
			'post_type'      => 'attachment',
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data
		$this->site_icon_url = $upload['url'];
		$this->site_icon_id  = wp_insert_attachment( $attachment, $upload['file'] );
		wp_update_attachment_metadata( $this->site_icon_id, wp_generate_attachment_metadata( $this->site_icon_id, $upload['file'] ) );
	}
}
