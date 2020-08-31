<?php
/**
 * Widget API: WP_Widget_Block class
 *
 * @package Gutenberg
 */

/**
 * Core class used to implement a Block widget.
 *
 * @see WP_Widget
 */
class WP_Widget_Block extends WP_Widget {

	/**
	 * Default instance.
	 *
	 * @since 4.8.1
	 * @var array
	 */
	protected $default_instance = array(
		'content' => '',
	);

	/**
	 * Sets up a new Block widget instance.
	 *
	 * @since 4.8.1
	 */
	public function __construct() {
		$widget_ops  = array(
			'classname'                   => 'widget_block',
			'description'                 => __( 'Gutenberg block.', 'gutenberg' ),
			'customize_selective_refresh' => true,
		);
		$control_ops = array(
			'width'  => 400,
			'height' => 350,
		);
		parent::__construct( 'block', __( 'Block', 'gutenberg' ), $widget_ops, $control_ops );
	}

	/**
	 * Outputs the content for the current Block widget instance.
	 *
	 * @since 4.8.1
	 *
	 * @global WP_Post $post Global post object.
	 *
	 * @param array $args     Display arguments including 'before_title', 'after_title',
	 *                        'before_widget', and 'after_widget'.
	 * @param array $instance Settings for the current Block widget instance.
	 */
	public function widget( $args, $instance ) {
		echo do_blocks( $instance['content'] );
	}

	/**
	 * Handles updating settings for the current Block widget instance.
	 *
	 * @since 4.8.1
	 *
	 * @param array $new_instance New settings for this instance as input by the user via
	 *                            WP_Widget::form().
	 * @param array $old_instance Old settings for this instance.
	 * @return array Settings to save or bool false to cancel saving.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance            = array_merge( $this->default_instance, $old_instance );
		$instance['content'] = $new_instance['content'];
		return $instance;
	}

	/**
	 * Outputs the Block widget settings form.
	 *
	 * @see WP_Widget_Custom_HTML::render_control_template_scripts()
	 *
	 * @param array $instance Current instance.
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->default_instance );
		echo do_blocks( $instance['content'] );
		?>
		<textarea id="<?php echo $this->get_field_id( 'content' ); ?>" name="<?php echo $this->get_field_name( 'content' ); ?>"  class="content sync-input" hidden><?php echo esc_textarea( $instance['content'] ); ?></textarea>
		<?php
	}

}
