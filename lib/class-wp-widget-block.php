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
		add_action( 'is_wide_widget_in_customizer', array( $this, 'set_is_wide_widget_in_customizer' ), 10, 2 );
	}

	/**
	 * Outputs the content for the current Block widget instance.
	 *
	 * @param array $args Display arguments including 'before_title', 'after_title',
	 *                        'before_widget', and 'after_widget'.
	 * @param array $instance Settings for the current Block widget instance.
	 *
	 * @since 4.8.1
	 *
	 * @global WP_Post $post Global post object.
	 */
	public function widget( $args, $instance ) {
		echo $args['before_widget'];
		$content = do_blocks( $instance['content'] );

		// Handle embeds for block widgets.
		//
		// When this feature is added to core it may need to be implemented
		// differently. WP_Widget_Text is a good reference, that applies a
		// filter for its content, which WP_Embed uses in its constructor.
		// See https://core.trac.wordpress.org/ticket/51566.
		global $wp_embed;
		echo $wp_embed->autoembed( $content );

		echo $args['after_widget'];
	}

	/**
	 * Handles updating settings for the current Block widget instance.
	 *
	 * @param array $new_instance New settings for this instance as input by the user via
	 *                            WP_Widget::form().
	 * @param array $old_instance Old settings for this instance.
	 *
	 * @return array Settings to save or bool false to cancel saving.
	 * @since 4.8.1
	 */
	public function update( $new_instance, $old_instance ) {
		$instance            = array_merge( $this->default_instance, $old_instance );
		$instance['content'] = $new_instance['content'];

		return $instance;
	}

	/**
	 * Outputs the Block widget settings form.
	 *
	 * @param array $instance Current instance.
	 *
	 * @see WP_Widget_Custom_HTML::render_control_template_scripts()
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->default_instance );
		echo do_blocks( $instance['content'] );
		$textarea_id = $this->get_field_id( 'content' );
		?>
		<br/>
		<textarea id="<?php echo $textarea_id; ?>" name="<?php echo $this->get_field_name( 'content' ); ?>"
				class="content sync-input" hidden><?php echo esc_textarea( $instance['content'] ); ?></textarea>
		<script>
			(function() {
				var link = "<?php echo esc_js( admin_url( 'themes.php?page=gutenberg-widgets' ) ); ?>";
				var container = jQuery('#<?php echo $textarea_id; ?>').closest(".form").find('.widget-control-actions .alignleft');
				container.prepend(jQuery('<span> |</span>'));
				container.prepend(jQuery('<a href="'+link+'" class="button-link">Edit</a>'));
			})();
		</script>
		<?php
	}

	/**
	 * Make sure no block widget is considered to be wide.
	 *
	 * @param boolean $is_wide Is regarded wide.
	 * @param string  $widget_id Widget ID.
	 *
	 * @return bool Updated is_wide value.
	 */
	public function set_is_wide_widget_in_customizer( $is_wide, $widget_id ) {
		if ( strpos( $widget_id, 'block-' ) === 0 ) {
			return false;
		}

		return $is_wide;
	}

}
