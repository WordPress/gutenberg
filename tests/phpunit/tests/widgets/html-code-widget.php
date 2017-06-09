<?php
/**
 * Unit tests covering WP_Widget_HTML_Code functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-html-code.php
 *
 * @group widgets
 */
class Test_WP_Widget_HTML_Code extends WP_UnitTestCase {

	/**
	 * Args passed to the widget_html_code_content filter.
	 *
	 * @var array
	 */
	protected $widget_html_code_content_args;

	/**
	 * Test widget method.
	 *
	 * @covers WP_Widget_HTML_Code::widget
	 */
	function test_widget() {
		$widget = new WP_Widget_HTML_Code();
		$content = "<i>Custom HTML</i>\n\n<b>CODE</b>\nLast line.<u>unclosed";

		$args = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget'  => "</section>\n",
		);
		$instance = array(
			'title'   => 'Foo',
			'content' => $content,
		);

		$this->assertEquals( 10, has_filter( 'widget_html_code_content', 'balanceTags' ) );

		update_option( 'use_balanceTags', 0 );
		add_filter( 'widget_html_code_content', array( $this, 'filter_widget_html_code_content' ), 5, 3 );
		ob_start();
		$this->widget_html_code_content_args = null;
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertNotEmpty( $this->widget_html_code_content_args );
		$this->assertContains( '[filter:widget_html_code_content]', $output );
		$this->assertNotContains( '<p>', $output );
		$this->assertNotContains( '<br>', $output );
		$this->assertNotContains( '</u>', $output );
		$this->assertEquals( $instance, $this->widget_html_code_content_args[1] );
		$this->assertSame( $widget, $this->widget_html_code_content_args[2] );
		remove_filter( 'widget_html_code_content', array( $this, 'filter_widget_html_code_content' ), 5, 3 );

		update_option( 'use_balanceTags', 1 );
		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertContains( '</u>', $output );
	}

	/**
	 * Filters the content of the HTML Code widget.
	 *
	 * @param string              $widget_content The widget content.
	 * @param array               $instance       Array of settings for the current widget.
	 * @param WP_Widget_HTML_Code $widget         Current HTML Code widget instance.
	 * @return string Widget content.
	 */
	function filter_widget_html_code_content( $widget_content, $instance, $widget ) {
		$this->widget_html_code_content_args = func_get_args();

		$widget_content .= '[filter:widget_html_code_content]';
		return $widget_content;
	}

	/**
	 * Test update method.
	 *
	 * @covers WP_Widget_HTML_Code::update
	 */
	function test_update() {
		$widget = new WP_Widget_HTML_Code();
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
	function grant_unfiltered_html_cap( $caps, $cap ) {
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
	function revoke_unfiltered_html_cap( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			$caps = array_diff( $caps, array( 'unfiltered_html' ) );
			$caps[] = 'do_not_allow';
		}
		return $caps;
	}
}
