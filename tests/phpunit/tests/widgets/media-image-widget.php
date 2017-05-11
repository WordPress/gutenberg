<?php
/**
 * Unit tests covering WP_Widget_Media_Image functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-image.php
 *
 * @group widgets
 */
class Test_WP_Widget_Media_Image extends WP_UnitTestCase {

	/**
	 * Clean up global scope.
	 *
	 * @global WP_Scripts $wp_scripts
	 * @global WP_Styles $wp_styles
	 */
	function clean_up_global_scope() {
		global $wp_scripts, $wp_styles;
		parent::clean_up_global_scope();
		$wp_scripts = null;
		$wp_styles = null;
	}

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media_Image::get_instance_schema
	 */
	function test_get_instance_schema() {
		$widget = new WP_Widget_Media_Image();
		$schema = $widget->get_instance_schema();

		$this->assertEqualSets( array(
			'alt',
			'attachment_id',
			'caption',
			'height',
			'image_classes',
			'image_title',
			'link_classes',
			'link_rel',
			'link_target_blank',
			'link_type',
			'link_url',
			'size',
			'title',
			'url',
			'width',
		), array_keys( $schema ) );
	}

	/**
	 * Test constructor.
	 *
	 * @covers WP_Widget_Media_Image::__construct()
	 */
	function test_constructor() {
		$widget = new WP_Widget_Media_Image();

		$this->assertArrayHasKey( 'mime_type', $widget->widget_options );
		$this->assertArrayHasKey( 'customize_selective_refresh', $widget->widget_options );
		$this->assertArrayHasKey( 'description', $widget->widget_options );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
		$this->assertEquals( 'image', $widget->widget_options['mime_type'] );
		$this->assertEqualSets( array(
			'add_to_widget',
			'replace_media',
			'edit_media',
			'media_library_state_multi',
			'media_library_state_single',
			'missing_attachment',
			'no_media_selected',
			'add_media',
			'unsupported_file_type',
		), array_keys( $widget->l10n ) );
	}

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media_Image::update
	 */
	function test_update() {
		$widget = new WP_Widget_Media_Image();
		$instance = array();

		// Should return valid attachment ID.
		$expected = array(
			'attachment_id' => 1,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment ID.
		$result = $widget->update( array(
			'attachment_id' => 'media',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid attachment url.
		$expected = array(
			'url' => 'https://example.org',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update( array(
			'url' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['url'] );

		// Should return valid attachment title.
		$expected = array(
			'title' => 'What a title',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update( array(
			'title' => '<h1>W00t!</h1>',
		), $instance );
		$this->assertNotSame( $result, $instance );

		// Should return valid image size.
		$expected = array(
			'size' => 'thumbnail',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image size.
		$result = $widget->update( array(
			'size' => 'big league',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image width.
		$expected = array(
			'width' => 300,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image width.
		$result = $widget->update( array(
			'width' => 'wide',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image height.
		$expected = array(
			'height' => 200,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image height.
		$result = $widget->update( array(
			'height' => 'high',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image caption.
		$expected = array(
			'caption' => 'A caption with <a href="#">link</a>',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image caption.
		$result = $widget->update( array(
			'caption' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'caption' => '"&gt;<i />',
		) );

		// Should return valid alt text.
		$expected = array(
			'alt' => 'A water tower',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid alt text.
		$result = $widget->update( array(
			'alt' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'alt' => '">',
		) );

		// Should return valid link type.
		$expected = array(
			'link_type' => 'file',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid link type.
		$result = $widget->update( array(
			'link_type' => 'interesting',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid link url.
		$expected = array(
			'link_url' => 'https://example.org',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid link url.
		$result = $widget->update( array(
			'link_url' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['link_url'] );

		// Should return valid image classes.
		$expected = array(
			'image_classes' => 'A water tower',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image classes.
		$result = $widget->update( array(
			'image_classes' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'image_classes' => 'i onloadalerthello',
		) );

		// Should return valid link classes.
		$expected = array(
			'link_classes' => 'A water tower',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid link classes.
		$result = $widget->update( array(
			'link_classes' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'link_classes' => 'i onloadalerthello',
		) );

		// Should return valid rel text.
		$expected = array(
			'link_rel' => 'previous',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid rel text.
		$result = $widget->update( array(
			'link_rel' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'link_rel' => 'i onloadalerthello',
		) );

		// Should return valid link target.
		$expected = array(
			'link_target_blank' => false,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid  link target.
		$result = $widget->update( array(
			'link_target_blank' => 'top',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image title.
		$expected = array(
			'image_title' => 'What a title',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image title.
		$result = $widget->update( array(
			'image_title' => '<h1>W00t!</h1>',
		), $instance );
		$this->assertNotSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update( array(
			'imaginary_key' => 'value',
		), $instance );
		$this->assertSame( $result, $instance );
	}

	/**
	 * Test render_media method.
	 *
	 * @covers WP_Widget_Media_Image::render_media
	 */
	function test_render_media() {
		$widget = new WP_Widget_Media_Image();
		$attachment_id = self::factory()->attachment->create_object( array(
			'file' => DIR_TESTDATA . '/images/canola.jpg',
			'post_parent' => 0,
			'post_mime_type' => 'image/jpeg',
			'post_title' => 'Canola',
		) );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, DIR_TESTDATA . '/images/canola.jpg' ) );

		// Should be empty when there is no attachment_id.
		ob_start();
		$widget->render_media( array() );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		// Should be empty when there is an invalid attachment_id.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => 666,
		) );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
		) );
		$output = ob_get_clean();

		// No default title.
		$this->assertNotContains( 'title="', $output );
		// Default image classes.
		$this->assertContains( 'class="image wp-image-' . $attachment_id, $output );
		$this->assertContains( 'style="max-width: 100%; height: auto;"', $output );
		$this->assertContains( 'alt=""', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'image_title' => 'Custom Title',
			'image_classes' => 'custom-class',
			'alt' => 'A flower',
			'size' => 'custom',
			'width' => 100,
			'height' => 100,
		) );
		$output = ob_get_clean();

		// Custom image title.
		$this->assertContains( 'title="Custom Title"', $output );
		// Custom image class.
		$this->assertContains( 'class="image wp-image-' . $attachment_id . ' custom-class', $output );
		$this->assertContains( 'alt="A flower"', $output );
		$this->assertContains( 'width="100"', $output );
		$this->assertContains( 'height="100"', $output );

		// Embeded images.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => null,
			'caption' => 'With caption',
			'height' => 100,
			'link_type' => 'file',
			'url' => 'http://example.org/url/to/image.jpg',
			'width' => 100,
		) );
		$output = ob_get_clean();

		// Custom image class.
		$this->assertContains( 'src="http://example.org/url/to/image.jpg"', $output );

		// Link settings.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'link_type' => 'file',
		) );
		$output = ob_get_clean();

		$link = '<a href="' . wp_get_attachment_url( $attachment_id ) . '"';
		$this->assertContains( $link, $output );
		$link .= ' class=""';
		$this->assertContains( $link, $output );
		$link .= ' rel=""';
		$this->assertContains( $link, $output );
		$link .= ' target=""';
		$this->assertContains( $link, $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'link_type' => 'post',
			'link_classes' => 'custom-link-class',
			'link_rel' => 'attachment',
			'link_target_blank' => false,
		) );
		$output = ob_get_clean();

		$this->assertContains( '<a href="' . get_attachment_link( $attachment_id ) . '"', $output );
		$this->assertContains( 'class="custom-link-class"', $output );
		$this->assertContains( 'rel="attachment"', $output );
		$this->assertContains( 'target=""', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'link_type' => 'custom',
			'link_url' => 'https://example.org',
			'link_target_blank' => true,
		) );
		$output = ob_get_clean();

		$this->assertContains( '<a href="https://example.org"', $output );
		$this->assertContains( 'target="_blank"', $output );

		// Caption settings.
		wp_update_post( array(
			'ID' => $attachment_id,
			'post_excerpt' => 'Default caption',
		) );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
		) );
		$output = ob_get_clean();

		$this->assertContains( 'class="wp-caption alignnone"', $output );
		$this->assertContains( '<p class="wp-caption-text">Default caption</p>', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'caption' => 'Custom caption',
		) );
		$output = ob_get_clean();

		$this->assertContains( 'class="wp-caption alignnone"', $output );
		$this->assertContains( '<p class="wp-caption-text">Custom caption</p>', $output );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Media_Image::enqueue_admin_scripts
	 */
	function test_enqueue_admin_scripts() {
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Media_Image();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'media-image-widget' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Media_Image::render_control_template_scripts
	 */
	function test_render_control_template_scripts() {
		$widget = new WP_Widget_Media_Image();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-wp-media-widget-image-preview">', $output );
	}
}
