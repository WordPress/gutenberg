<?php
/**
 * Unit tests covering WP_Widget_Custom_HTML functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-custom-html.php
 *
 * @group widgets
 */
class Test_WP_Widget_Custom_HTML extends WP_UnitTestCase {

	/**
	 * Args passed to the widget_custom_html_content filter.
	 *
	 * @var array
	 */
	protected $widget_custom_html_content_args;

	/**
	 * Args passed to the widget_text filter.
	 *
	 * @var array
	 */
	protected $widget_text_args;

	/**
	 * Clean up global scope.
	 *
	 * @global WP_Scripts $wp_scripts
	 * @global WP_Styles  $wp_style
	 */
	public function clean_up_global_scope() {
		global $wp_scripts, $wp_styles;
		parent::clean_up_global_scope();
		$wp_scripts = null;
		$wp_styles = null;
	}

	/**
	 * Test construct.
	 *
	 * @covers WP_Widget_Custom_HTML::__construct
	 */
	public function test_construct() {
		$widget = new WP_Widget_Custom_HTML();
		$this->assertEquals( 'custom_html', $widget->id_base );
		$this->assertEquals( 'widget_custom_html', $widget->widget_options['classname'] );
		$this->assertEquals( 400, $widget->control_options['width'] );
		$this->assertEquals( 350, $widget->control_options['height'] );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Custom_HTML::_register
	 */
	public function test__register() {
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Custom_HTML();
		$widget->_register();

		$this->assertEquals( 10, has_action( 'admin_print_scripts-widgets.php', array( $widget, 'enqueue_admin_scripts' ) ) );
		$this->assertEquals( 10, has_action( 'admin_footer-widgets.php', array( 'WP_Widget_Custom_HTML', 'render_control_template_scripts' ) ) );
		$this->assertEquals( 10, has_action( 'admin_head-widgets.php', array( 'WP_Widget_Custom_HTML', 'add_help_text' ) ) );
		$this->assertContains( 'wp.customHtmlWidgets.idBases.push( "custom_html" );', wp_scripts()->registered['custom-html-widgets']->extra['after'] );
	}

	/**
	 * Test widget method.
	 *
	 * @covers WP_Widget_Custom_HTML::widget
	 */
	public function test_widget() {
		$widget = new WP_Widget_Custom_HTML();
		$content = "<i>Custom HTML</i>\n\n<b>CODE</b>\nLast line.<u>unclosed";

		$args = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section id="custom_html-5" class="widget widget_custom_html">',
			'after_widget'  => "</section>\n",
		);
		$instance = array(
			'title'   => 'Foo',
			'content' => $content,
		);

		// Convert Custom HTML widget instance into Text widget instance data.
		$text_widget_instance = array_merge( $instance, array(
			'text' => $instance['content'],
			'filter' => false,
			'visual' => false,
		) );
		unset( $text_widget_instance['content'] );

		update_option( 'use_balanceTags', 0 );
		add_filter( 'widget_custom_html_content', array( $this, 'filter_widget_custom_html_content' ), 5, 3 );
		add_filter( 'widget_text', array( $this, 'filter_widget_text' ), 10, 3 );
		ob_start();
		$this->widget_custom_html_content_args = null;
		$this->widget_text_args = null;
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertNotEmpty( $this->widget_custom_html_content_args );
		$this->assertNotEmpty( $this->widget_text_args );
		$this->assertContains( '[filter:widget_text][filter:widget_custom_html_content]', $output );
		$this->assertContains( '<section id="custom_html-5" class="widget_text widget widget_custom_html">', $output );
		$this->assertContains( '<div class="textwidget custom-html-widget">', $output );
		$this->assertNotContains( '<p>', $output );
		$this->assertNotContains( '<br>', $output );
		$this->assertNotContains( '</u>', $output );
		$this->assertEquals( $text_widget_instance, $this->widget_text_args[1] );
		$this->assertEquals( $instance, $this->widget_custom_html_content_args[1] );
		$this->assertSame( $widget, $this->widget_text_args[2] );
		$this->assertSame( $widget, $this->widget_custom_html_content_args[2] );
		remove_filter( 'widget_custom_html_content', array( $this, 'filter_widget_custom_html_content' ), 5 );
		remove_filter( 'widget_text', array( $this, 'filter_widget_text' ), 10 );

		update_option( 'use_balanceTags', 1 );
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertContains( '</u>', $output );
	}

	/**
	 * Filters the content of the Custom HTML widget using the legacy widget_text filter.
	 *
	 * @param string                $text     The widget content.
	 * @param array                 $instance Array of settings for the current widget.
	 * @param WP_Widget_Custom_HTML $widget   Current widget instance.
	 * @return string Widget content.
	 */
	public function filter_widget_text( $text, $instance, $widget ) {
		$this->widget_text_args = array( $text, $instance, $widget );
		$text .= '[filter:widget_text]';
		return $text;
	}

	/**
	 * Filters the content of the Custom HTML widget using the dedicated widget_custom_html_content filter.
	 *
	 * @param string                $widget_content The widget content.
	 * @param array                 $instance       Array of settings for the current widget.
	 * @param WP_Widget_Custom_HTML $widget         Current Custom HTML widget instance.
	 * @return string Widget content.
	 */
	public function filter_widget_custom_html_content( $widget_content, $instance, $widget ) {
		$this->widget_custom_html_content_args = array( $widget_content, $instance, $widget );
		$widget_content .= '[filter:widget_custom_html_content]';
		return $widget_content;
	}

	/**
	 * Test update method.
	 *
	 * @covers WP_Widget_Custom_HTML::update
	 */
	public function test_update() {
		$widget = new WP_Widget_Custom_HTML();
		$instance = array(
			'title'   => "The\n<b>Title</b>",
			'content' => "The\n\n<b>Code</b>",
		);

		wp_set_current_user( $this->factory()->user->create( array(
			'role' => 'administrator',
		) ) );

		// Should return valid instance.
		$expected = array(
			'title'   => sanitize_text_field( $instance['title'] ),
			'content' => $instance['content'],
		);
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $result, $expected );

		// Make sure KSES is applying as expected.
		add_filter( 'map_meta_cap', array( $this, 'grant_unfiltered_html_cap' ), 10, 2 );
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
		$instance['content'] = '<script>alert( "Howdy!" );</script>';
		$expected['content'] = $instance['content'];
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $result, $expected );
		remove_filter( 'map_meta_cap', array( $this, 'grant_unfiltered_html_cap' ) );

		add_filter( 'map_meta_cap', array( $this, 'revoke_unfiltered_html_cap' ), 10, 2 );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
		$instance['content'] = '<script>alert( "Howdy!" );</script>';
		$expected['content'] = wp_kses_post( $instance['content'] );
		$result = $widget->update( $instance, array() );
		$this->assertEquals( $result, $expected );
		remove_filter( 'map_meta_cap', array( $this, 'revoke_unfiltered_html_cap' ), 10 );
	}

	/**
	 * Grant unfiltered_html cap via map_meta_cap.
	 *
	 * @param array  $caps    Returns the user's actual capabilities.
	 * @param string $cap     Capability name.
	 * @return array Caps.
	 */
	public function grant_unfiltered_html_cap( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			$caps = array_diff( $caps, array( 'do_not_allow' ) );
			$caps[] = 'unfiltered_html';
		}
		return $caps;
	}

	/**
	 * Revoke unfiltered_html cap via map_meta_cap.
	 *
	 * @param array  $caps    Returns the user's actual capabilities.
	 * @param string $cap     Capability name.
	 * @return array Caps.
	 */
	public function revoke_unfiltered_html_cap( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			$caps = array_diff( $caps, array( 'unfiltered_html' ) );
			$caps[] = 'do_not_allow';
		}
		return $caps;
	}

	/**
	 * Test enqueue_admin_scripts method. Condition: logged_in, syntax_highlighting is on.
	 *
	 * @covers WP_Widget_Custom_HTML::enqueue_admin_scripts
	 */
	public function test_enqueue_admin_scripts_when_logged_in_and_syntax_highlighting_on() {
		$user = $this->factory()->user->create();
		wp_set_current_user( $user );
		wp_get_current_user()->syntax_highlighting = 'true';
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Custom_HTML();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'custom-html-widgets', 'enqueued' ) );
		$this->assertTrue( wp_script_is( 'code-editor', 'enqueued' ) );
		$this->assertTrue( wp_script_is( 'wp-codemirror', 'enqueued' ) );
		$this->assertTrue( wp_script_is( 'csslint', 'enqueued' ) );
		$this->assertTrue( wp_script_is( 'jshint', 'enqueued' ) );
		$this->assertTrue( wp_script_is( 'htmlhint', 'enqueued' ) );
	}

	/**
	 * Test enqueue_admin_scripts method. Condition: logged_in, syntax_highlighting is off.
	 *
	 * @covers WP_Widget_Custom_HTML::enqueue_admin_scripts
	 */
	public function test_enqueue_admin_scripts_when_logged_in_and_syntax_highlighting_off() {
		$user = $this->factory()->user->create();
		wp_set_current_user( $user );
		update_user_meta( $user, 'syntax_highlighting', 'false' );
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Custom_HTML();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'custom-html-widgets', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'code-editor', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'wp-codemirror', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'csslint', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'jshint', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'htmlhint', 'enqueued' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Custom_HTML::render_control_template_scripts
	 */
	public function test_render_control_template_scripts() {
		ob_start();
		WP_Widget_Custom_HTML::render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-widget-custom-html-control-fields">', $output );
	}

	/**
	 * Test add_help_text method.
	 *
	 * @covers WP_Widget_Custom_HTML::add_help_text
	 */
	public function test_add_help_text() {
		set_current_screen( 'widgets.php' );
		WP_Widget_Custom_HTML::add_help_text();
		$help_tab = get_current_screen()->get_help_tab( 'custom_html_widget' );

		$this->assertContains( 'Use the Custom HTML widget to add arbitrary HTML code to your widget areas.', $help_tab['content'] );
	}
}
