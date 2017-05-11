<?php
/**
 * Unit tests covering WP_Widget_Media functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Class Test_WP_Widget_Media
 *
 * @group widgets
 */
class Test_WP_Widget_Media extends WP_UnitTestCase {

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
	 * Get instance for mocked media widget class.
	 *
	 * @param string $id_base         Base ID for the widget, lowercase and unique.
	 * @param string $name            Name for the widget displayed on the configuration page.
	 * @param array  $widget_options  Optional. Widget options.
	 * @param array  $control_options Optional. Widget control options.
	 * @return PHPUnit_Framework_MockObject_MockObject|WP_Widget_Media Mocked instance.
	 */
	function get_mocked_class_instance( $id_base = 'mocked', $name = 'Mocked', $widget_options = array(), $control_options = array() ) {
		$original_class_name = 'WP_Widget_Media';
		$arguments = array( $id_base, $name, $widget_options, $control_options );
		$mock_class_name = '';
		$call_original_constructor = true;
		$call_original_clone = true;
		$call_autoload = true;
		$mocked_methods = array( 'render_media' );

		return $this->getMockForAbstractClass( $original_class_name, $arguments, $mock_class_name, $call_original_constructor, $call_original_clone, $call_autoload, $mocked_methods );
	}

	/**
	 * Test constructor.
	 *
	 * @covers WP_Widget_Media::__construct()
	 * @covers WP_Widget_Media::_register()
	 */
	function test_constructor() {
		$widget = $this->get_mocked_class_instance();
		$widget->_register();

		$this->assertArrayHasKey( 'mime_type', $widget->widget_options );
		$this->assertArrayHasKey( 'customize_selective_refresh', $widget->widget_options );
		$this->assertArrayHasKey( 'description', $widget->widget_options );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
		$this->assertEmpty( $widget->widget_options['mime_type'] );
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
		$this->assertEquals( count( $widget->l10n ), count( array_filter( $widget->l10n ) ), 'Expected all translation strings to be defined.' );
		$this->assertEquals( 10, has_action( 'admin_print_scripts-widgets.php', array( $widget, 'enqueue_admin_scripts' ) ) );
		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( $widget, 'enqueue_preview_scripts' ) ), 'Did not expect preview scripts to be enqueued when not in customize preview context.' );
		$this->assertEquals( 10, has_action( 'admin_footer-widgets.php', array( $widget, 'render_control_template_scripts' ) ) );

		// With non-default args.
		$id_base = 'media_pdf';
		$name = 'PDF';
		$widget_options = array(
			'mime_type' => 'application/pdf',
		);
		$control_options = array(
			'width' => 850,
			'height' => 1100,
		);
		$widget = $this->get_mocked_class_instance( $id_base, $name, $widget_options, $control_options );
		$this->assertEquals( $id_base, $widget->id_base );
		$this->assertEquals( $name, $widget->name );

		// Method assertArraySubset doesn't exist in phpunit versions compatible with PHP 5.2.
		if ( method_exists( $this, 'assertArraySubset' ) ) {
			$this->assertArraySubset( $widget_options, $widget->widget_options );
			$this->assertArraySubset( $control_options, $widget->control_options );
		}
	}

	/**
	 * Test constructor in customize preview.
	 *
	 * @global WP_Customize_Manager $wp_customize
	 * @covers WP_Widget_Media::__construct()
	 * @covers WP_Widget_Media::_register()
	 */
	function test_constructor_in_customize_preview() {
		global $wp_customize;
		wp_set_current_user( $this->factory()->user->create( array(
			'role' => 'administrator',
		) ) );
		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager( array(
			'changeset_uuid' => wp_generate_uuid4(),
		) );
		$wp_customize->start_previewing_theme();

		$widget = $this->get_mocked_class_instance();
		$widget->_register();
		$this->assertEquals( 10, has_action( 'wp_enqueue_scripts', array( $widget, 'enqueue_preview_scripts' ) ) );
	}

	/**
	 * Test is_attachment_with_mime_type method.
	 *
	 * @covers WP_Widget_Media::is_attachment_with_mime_type
	 */
	function test_is_attachment_with_mime_type() {
		$attachment_id = self::factory()->attachment->create_object( array(
			'file' => DIR_TESTDATA . '/images/canola.jpg',
			'post_parent' => 0,
			'post_mime_type' => 'image/jpeg',
			'post_title' => 'Canola',
		) );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, DIR_TESTDATA . '/images/canola.jpg' ) );
		$widget = $this->get_mocked_class_instance();

		$this->assertFalse( $widget->is_attachment_with_mime_type( 0, 'image' ) );
		$this->assertFalse( $widget->is_attachment_with_mime_type( -123, 'image' ) );

		$post_id = $this->factory()->post->create();
		$this->assertFalse( $widget->is_attachment_with_mime_type( $post_id, 'image' ) );
		$this->assertFalse( $widget->is_attachment_with_mime_type( $attachment_id, 'video' ) );
		$this->assertTrue( $widget->is_attachment_with_mime_type( $attachment_id, 'image' ) );
	}

	/**
	 * Test sanitize_token_list method.
	 *
	 * @covers WP_Widget_Media::sanitize_token_list
	 */
	function test_sanitize_token_list_string() {
		$widget = $this->get_mocked_class_instance();

		$result = $widget->sanitize_token_list( 'What A false class with-token <a href="#">and link</a>' );
		$this->assertEquals( 'What A false class with-token a hrefand linka', $result );

		$result = $widget->sanitize_token_list( array( 'foo', '<i>bar', '">NO' ) );
		$this->assertEquals( $result, 'foo ibar NO' );
	}

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media::get_instance_schema
	 */
	function test_get_instance_schema() {
		$widget = $this->get_mocked_class_instance();
		$schema = $widget->get_instance_schema();

		$this->assertEqualSets( array(
			'attachment_id',
			'title',
			'url',
		), array_keys( $schema ) );
	}

	/**
	 * Test update method.
	 *
	 * @covers WP_Widget_Media::update()
	 */
	function test_update() {
		$widget = $this->get_mocked_class_instance();
		$instance = array();

		// Should return valid attachment ID.
		$expected = array(
			'attachment_id' => 1,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment ID.
		$result = $widget->update(
			array(
				'attachment_id' => 'media',
			),
			$instance
		);
		$this->assertSame( $result, $instance );

		// Should return valid attachment url.
		$expected = array(
			'url' => 'https://example.org',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update(
			array(
				'url' => 'not_a_url',
			),
			$instance
		);
		$this->assertNotSame( $result, $instance );

		// Should return valid attachment title.
		$expected = array(
			'title' => 'What a title',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update(
			array(
				'title' => '<h1>W00t!</h1>',
			),
			$instance
		);
		$this->assertNotSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update(
			array(
				'imaginary_key' => 'value',
			),
			$instance
		);
		$this->assertSame( $result, $instance );

		add_filter( 'sanitize_text_field', array( $this, '_return_wp_error' ) );
		$result = $widget->update(
			array(
				'title' => 'Title',
			),
			$instance
		);
		remove_filter( 'sanitize_text_field', array( $this, '_return_wp_error' ) );
		$this->assertSame( $result, $instance );
	}

	/**
	 * Helper function for Test_WP_Widget_Media::test_update().
	 *
	 * @return \WP_Error
	 */
	function _return_wp_error() {
		return new WP_Error( 'some-error', 'This is not valid!' );
	}

	/**
	 * Test widget method.
	 *
	 * @covers WP_Widget_Media::widget()
	 * @covers WP_Widget_Media::render_media()
	 */
	function test_widget() {
		$args = array(
			'before_title' => '<h2>',
			'after_title' => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget' => "</section>\n",
		);
		$instance = array(
			'title' => 'Foo',
			'url' => 'http://example.com/image.jpg',
			'attachment_id' => 0,
		);

		add_filter( 'widget_mocked_instance', array( $this, 'filter_widget_mocked_instance' ), 10, 3 );

		ob_start();
		$widget = $this->get_mocked_class_instance();
		$widget->expects( $this->atLeastOnce() )->method( 'render_media' )->with( $instance );
		$this->widget_instance_filter_args = array();
		$widget->widget( $args, $instance );
		$this->assertCount( 3, $this->widget_instance_filter_args );
		$this->assertEquals( $instance, $this->widget_instance_filter_args[0] );
		$this->assertEquals( $args, $this->widget_instance_filter_args[1] );
		$this->assertEquals( $widget, $this->widget_instance_filter_args[2] );
		$output = ob_get_clean();

		$this->assertContains( '<h2>Foo</h2>', $output );
		$this->assertContains( '<section>', $output );
		$this->assertContains( '</section>', $output );

		// No title.
		ob_start();
		$widget = $this->get_mocked_class_instance();
		$instance['title'] = '';
		$widget->expects( $this->atLeastOnce() )->method( 'render_media' )->with( $instance );
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertNotContains( '<h2>Foo</h2>', $output );

		// No attachment_id nor url.
		$instance['url'] = '';
		$instance['attachment_id'] = 0;
		ob_start();
		$widget = $this->get_mocked_class_instance();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertEmpty( $output );
	}

	/**
	 * Args passed to the widget_{$id_base}_instance filter.
	 *
	 * @var array
	 */
	protected $widget_instance_filter_args = array();

	/**
	 * Filters the media widget instance prior to rendering the media.
	 *
	 * @param array           $instance Instance data.
	 * @param array           $args     Widget args.
	 * @param WP_Widget_Media $object   Widget object.
	 * @return array Instance.
	 */
	function filter_widget_mocked_instance( $instance, $args, $object ) {
		$this->widget_instance_filter_args = func_get_args();
		return $instance;
	}

	/**
	 * Test form method.
	 *
	 * @covers WP_Widget_Media::form()
	 */
	function test_form() {
		$widget = $this->get_mocked_class_instance();

		ob_start();
		$widget->form( array() );
		$output = ob_get_clean();

		$this->assertContains( 'name="widget-mocked[][attachment_id]"', $output );
		$this->assertContains( 'name="widget-mocked[][title]"', $output );
		$this->assertContains( 'name="widget-mocked[][url]"', $output );
	}

	/**
	 * Test display_media_state method.
	 *
	 * @covers WP_Widget_Media::display_media_state()
	 */
	function test_display_media_state() {
		$widget = $this->get_mocked_class_instance();
		$attachment_id = self::factory()->attachment->create_object( array(
			'file' => DIR_TESTDATA . '/images/canola.jpg',
			'post_parent' => 0,
			'post_mime_type' => 'image/jpeg',
		) );

		$result = $widget->display_media_state( array(), get_post( $attachment_id ) );
		$this->assertEqualSets( array(), $result );

		$widget->save_settings( array(
			array(
				'attachment_id' => $attachment_id,
			),
		) );
		$result = $widget->display_media_state( array(), get_post( $attachment_id ) );
		$this->assertEqualSets( array( $widget->l10n['media_library_state_single'] ), $result );

		$widget->save_settings( array(
			array(
				'attachment_id' => $attachment_id,
			),
			array(
				'attachment_id' => $attachment_id,
			),
		) );
		$result = $widget->display_media_state( array(), get_post( $attachment_id ) );
		$this->assertEqualSets( array( sprintf( $widget->l10n['media_library_state_multi']['singular'], 2 ) ), $result );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Media::enqueue_admin_scripts()
	 */
	function test_enqueue_admin_scripts() {
		set_current_screen( 'widgets.php' );
		$widget = $this->get_mocked_class_instance();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'media-widgets' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Media::render_control_template_scripts
	 */
	function test_render_control_template_scripts() {
		$widget = $this->get_mocked_class_instance();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-widget-media-mocked-control">', $output );
	}

	/**
	 * Test has_content method.
	 *
	 * @covers WP_Widget_Media::has_content()
	 */
	function test_has_content() {
		if ( version_compare( PHP_VERSION, '5.3', '<' ) ) {
			$this->markTestSkipped( 'ReflectionMethod::setAccessible is only available for PHP 5.3+' );
			return;
		}

		$attachment_id = self::factory()->attachment->create_object( array(
			'file' => DIR_TESTDATA . '/images/canola.jpg',
			'post_parent' => 0,
			'post_mime_type' => 'image/jpeg',
		) );

		$wp_widget_media = new ReflectionClass( 'WP_Widget_Media' );
		$has_content = $wp_widget_media->getMethod( 'has_content' );
		$has_content->setAccessible( true );

		$result = $has_content->invokeArgs( $this->get_mocked_class_instance(), array(
			array(
				'attachment_id' => 0,
				'url' => '',
			),
		) );
		$this->assertFalse( $result );

		$result = $has_content->invokeArgs( $this->get_mocked_class_instance(), array(
			array(
				'attachment_id' => $attachment_id,
				'url' => '',
			),
		) );
		$this->assertTrue( $result );

		$result = $has_content->invokeArgs( $this->get_mocked_class_instance(), array(
			array(
				'attachment_id' => 0,
				'url' => 'http://example.com/image.jpg',
			),
		) );
		$this->assertTrue( $result );
	}
}
