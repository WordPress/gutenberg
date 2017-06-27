<?php
/**
 * Server-side rendering of the `core/archives` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/archives` block on server.
 *
 * @see WP_Widget_Archives
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with archives added.
 */
function gutenberg_render_block_core_archives( $attributes ) {
	$count = ! empty( $attributes['count'] ) ? '1' : '0';
	$dropdown = ! empty( $attributes['dropdown'] ) ? '1' : '0';

	if ( $dropdown ) {
		// Todo: 123 should be a unique number, see WP_Widget_Archives class.
		$dropdown_id = esc_attr( 'archives-dropdown-123' );
		$title = __( 'Archives' );

		/** This filter is documented in wp-includes/widgets/class-wp-widget-archives.php */
		$dropdown_args = apply_filters( 'widget_archives_dropdown_args', array(
			'type'            => 'monthly',
			'format'          => 'option',
			'show_post_count' => $count,
		) );

		$dropdown_args['echo'] = 0;

		$archives = wp_get_archives( $dropdown_args );

		switch ( $dropdown_args['type'] ) {
			case 'yearly':
				$label = __( 'Select Year' );
				break;
			case 'monthly':
				$label = __( 'Select Month' );
				break;
			case 'daily':
				$label = __( 'Select Day' );
				break;
			case 'weekly':
				$label = __( 'Select Week' );
				break;
			default:
				$label = __( 'Select Post' );
				break;
		}

		$label = esc_attr( $label );

		$block_content = <<<CONTENT
<div class="blocks-archives">
	<label class="screen-reader-text" for="{$dropdown_id}">{$title}</label>
	<select id="{$dropdown_id}" name="archive-dropdown" onchange='document.location.href=this.options[this.selectedIndex].value;'>
	<option value="">{$label}</option>
	{$archives}
</div>
CONTENT;
	} else {
		/** This filter is documented in wp-includes/widgets/class-wp-widget-archives.php */
		$archives_args = apply_filters( 'widget_archives_args', array(
			'type'            => 'monthly',
			'show_post_count' => $count,
		) );

		$archives_args['echo'] = 0;

		$archives = wp_get_archives( $archives_args );

		$block_content = <<<CONTENT
<div class="blocks-archives">
	{$archives}
</div>
CONTENT;
	}

	return $block_content;
}

register_block_type( 'core/archives', array(
	'render' => 'gutenberg_render_block_core_archives',
) );
