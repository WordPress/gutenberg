<?php
/**
 * Server-side rendering of the `core/latest-posts` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/latest-posts` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with latest posts added.
 */
function gutenberg_render_block_core_latest_posts( $attributes ) {
	$posts_to_show = 5;

	if ( array_key_exists( 'poststoshow', $attributes ) ) {
		$posts_to_show_attr = $attributes['poststoshow'];

		// Basic attribute validation.
		if (
			is_numeric( $posts_to_show_attr ) &&
			$posts_to_show_attr > 0 &&
			$posts_to_show_attr < 100
		) {
			$posts_to_show = $attributes['poststoshow'];
		}
	}

	$align = 'center';
	if ( isset( $attributes['align'] ) && in_array( $attributes['align'], array( 'left', 'right', 'wide', 'full' ), true ) ) {
		$align = $attributes['align'];
	}

	$recent_posts = wp_get_recent_posts( array(
		'numberposts' => $posts_to_show,
		'post_status' => 'publish',
	) );

	$posts_content = '';

	foreach ( $recent_posts as $post ) {
		$post_id = $post['ID'];
		$post_permalink = get_permalink( $post_id );
		$post_title = get_the_title( $post_id );

		$posts_content .= "<li><a href='{$post_permalink}'>{$post_title}</a></li>\n";
	}

	$class = 'wp-block-latest-posts ' . esc_attr( 'align' . $align );

	$block_content = <<<CONTENT
<div class="{$class}">
	<ul>
		{$posts_content}
	</ul>
</div>

CONTENT;

	return $block_content;
}

register_block_type( 'core/latest-posts', array(
	'render' => 'gutenberg_render_block_core_latest_posts',
) );
