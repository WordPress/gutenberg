<?php
/**
 * Plugin Name: Gutenberg Test Widgets
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-widgets
 */

/**
 * Test widget to be used in e2e tests.
 */
class Test_Widget extends WP_Widget {
	/**
	 * Sets up a new test widget instance.
	 */
	function __construct() {
		parent::__construct(
			'test_widget',
			'Test Widget',
			array( 'description' => 'Test widget.' )
		);
	}

	/**
	 * Outputs the content for the widget instance.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title',
	 *                        'before_widget', and 'after_widget'.
	 * @param array $instance Settings for the current Block widget instance.
	 */
	public function widget( $args, $instance ) {
		$title = apply_filters( 'widget_title', $instance['title'] );
		echo $args['before_widget'];
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}
		echo 'Hello Test Widget';
		echo $args['after_widget'];
	}

	/**
	 * Outputs the widget settings form.
	 *
	 * @param array $instance Current instance.
	 */
	public function form( $instance ) {
		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>">Title:</label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>
		<?php
	}

	/**
	 * Handles updating settings for the current widget instance.
	 *
	 * @param array $new_instance New settings for this instance as input by the user via
	 *                            WP_Widget::form().
	 *
	 * @return array Settings to save or bool false to cancel saving.
	 * @since 4.8.1
	 */
	public function update( $new_instance ) {
		$instance          = array();
		$instance['title'] = ( ! empty( $new_instance['title'] ) ) ? strip_tags( $new_instance['title'] ) : '';
		return $instance;
	}
}

/**
 * Register the widget.
 */
function load_test_widget() {
	register_widget( 'Test_Widget' );
}

add_action( 'widgets_init', 'load_test_widget' );
