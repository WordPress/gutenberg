<?php
/**
 * Unit tests covering WP_Widget_Media_Audio functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-audio.php
 *
 * @group widgets
 */
class Test_WP_Widget_Media_Audio extends WP_UnitTestCase {

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
	 * @covers WP_Widget_Media_Audio::get_instance_schema
	 */
	function test_get_instance_schema() {
		$wp_widget_audio = new WP_Widget_Media_Audio();
		$schema = $wp_widget_audio->get_instance_schema();

		$this->assertEqualSets(
			array_merge(
				array(
					'attachment_id',
					'preload',
					'loop',
					'title',
					'url',
				),
				wp_get_audio_extensions()
			),
			array_keys( $schema )
		);
	}

	/**
	 * Test constructor.
	 *
	 * @covers WP_Widget_Media_Audio::__construct()
	 */
	function test_constructor() {
		$widget = new WP_Widget_Media_Audio();

		$this->assertArrayHasKey( 'mime_type', $widget->widget_options );
		$this->assertArrayHasKey( 'customize_selective_refresh', $widget->widget_options );
		$this->assertArrayHasKey( 'description', $widget->widget_options );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
		$this->assertEquals( 'audio', $widget->widget_options['mime_type'] );
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
	 * @covers WP_Widget_Media_Audio::update
	 */
	function test_update() {
		$widget = new WP_Widget_Media_Audio();
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
			'url' => 'https://chickenandribs.org',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update( array(
			'url' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['url'] );

		// Should return loop setting.
		$expected = array(
			'loop' => true,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid loop setting.
		$result = $widget->update( array(
			'loop' => 'not-boolean',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid attachment title.
		$expected = array(
			'title' => 'An audio sample of parrots',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update( array(
			'title' => '<h1>Cute Baby Goats</h1>',
		), $instance );
		$this->assertNotSame( $result, $instance );

		// Should return valid preload setting.
		$expected = array(
			'preload' => 'none',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid preload setting.
		$result = $widget->update( array(
			'preload' => 'nope',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update( array(
			'h4x' => 'value',
		), $instance );
		$this->assertSame( $result, $instance );
	}

	/**
	 * Test render_media method.
	 *
	 * @covers WP_Widget_Media_Audio::render_media
	 */
	function test_render_media() {
		$test_audio_file = __FILE__ . '../../data/uploads/small-audio.mp3';
		$widget = new WP_Widget_Media_Audio();
		$attachment_id = self::factory()->attachment->create_object( array(
			'file' => $test_audio_file,
			'post_parent' => 0,
			'post_mime_type' => 'audio/mp3',
			'post_title' => 'Test Audio',
		) );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $test_audio_file ) );

		// Should be empty when there is no attachment_id.
		ob_start();
		$widget->render_media( array() );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		// Should be empty when there is an invalid attachment_id.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => 777,
		) );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		// Tests with audio from library.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
		) );
		$output = ob_get_clean();

		// Check default outputs.
		$this->assertContains( 'preload="none"', $output );
		$this->assertContains( 'class="wp-audio-shortcode"', $output );
		$this->assertContains( 'small-audio.mp3', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'title' => 'Funny',
			'preload' => 'auto',
			'loop' => true,
		) );
		$output = ob_get_clean();

		// Custom attributes.
		$this->assertContains( 'preload="auto"', $output );
		$this->assertContains( 'loop="1"', $output );
	}

	/**
	 * Test enqueue_preview_scripts method.
	 *
	 * @global WP_Scripts $wp_scripts
	 * @global WP_Styles $wp_styles
	 * @covers WP_Widget_Media_Audio::enqueue_preview_scripts
	 */
	function test_enqueue_preview_scripts() {
		global $wp_scripts, $wp_styles;
		$wp_scripts = null;
		$wp_styles = null;
		$widget = new WP_Widget_Media_Audio();

		$this->assertFalse( wp_script_is( 'wp-mediaelement' ) );
		$this->assertFalse( wp_style_is( 'wp-mediaelement' ) );

		$widget->enqueue_preview_scripts();

		$this->assertTrue( wp_script_is( 'wp-mediaelement' ) );
		$this->assertTrue( wp_style_is( 'wp-mediaelement' ) );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Media_Audio::enqueue_admin_scripts
	 */
	function test_enqueue_admin_scripts() {
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Media_Audio();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'media-audio-widget' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Media_Audio::render_control_template_scripts
	 */
	function test_render_control_template_scripts() {
		$widget = new WP_Widget_Media_Audio();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-wp-media-widget-audio-preview">', $output );
	}
}
