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

	$posts_to_show_attr = null;
	if ( array_key_exists( 'postsToShow', $attributes ) ) {
		$posts_to_show_attr = $attributes['postsToShow'];
	} elseif ( array_key_exists( 'poststoshow', $attributes ) ) {
		$posts_to_show_attr = $attributes['poststoshow'];
	}
	if ( null !== $posts_to_show_attr ) {
		$posts_to_show_attr = $attributes['postsToShow'];

		// Basic attribute validation.
		if (
			is_numeric( $posts_to_show_attr ) &&
			$posts_to_show_attr > 0 &&
			$posts_to_show_attr < 100
		) {
			$posts_to_show = intval( $posts_to_show_attr );
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

		$title = get_the_title( $post_id );
		if ( ! $title ) {
			$title = __( '(Untitled)', 'gutenberg' );
		}
		$posts_content .= sprintf(
			'<li><a href="%1$s">%2$s</a>',
			esc_url( get_permalink( $post_id ) ),
			esc_html( $title )
		);

		if ( $attributes['displayPostDate'] ) {
			$posts_content .= sprintf(
				'<time datetime="%1$s" class="wp-block-latest-posts__post-date">%2$s</time>',
				esc_attr( get_the_date( 'c', $post_id ) ),
				esc_html( get_the_date( '', $post_id ) )
			);
		}

		$posts_content .= "</li>\n";
	}

	$class = 'wp-block-latest-posts ' . esc_attr( 'align' . $align );
	if ( isset( $attributes['layout'] ) && 'grid' === $attributes['layout'] ) {
		$class .= ' is-grid';
	}

	$block_content = <<<CONTENT
<ul class="{$class}">
	{$posts_content}
</ul>
CONTENT;

	return $block_content;
}

register_block_type( 'core/latest-posts', array(
	'render' => 'gutenberg_render_block_core_latest_posts',
) );
