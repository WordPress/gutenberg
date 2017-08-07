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

	if ( array_key_exists( 'postsToShow', $attributes ) ) {

		// Basic attribute validation.
		if (
			is_numeric( $attributes['postsToShow'] ) &&
			$attributes['postsToShow'] > 0 &&
			$attributes['postsToShow'] < 100
		) {
			$posts_to_show = intval( $attributes['postsToShow'] );
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

	$list_items_markup = '';

	foreach ( $recent_posts as $post ) {
		$post_id = $post['ID'];

		$title = get_the_title( $post_id );
		if ( ! $title ) {
			$title = __( '(Untitled)', 'gutenberg' );
		}
		$list_items_markup .= sprintf(
			'<li><a href="%1$s">%2$s</a>',
			esc_url( get_permalink( $post_id ) ),
			esc_html( $title )
		);

		if ( isset( $attributes['displayPostDate'] ) && $attributes['displayPostDate'] ) {
			$list_items_markup .= sprintf(
				'<time datetime="%1$s" class="wp-block-latest-posts__post-date">%2$s</time>',
				esc_attr( get_the_date( 'c', $post_id ) ),
				esc_html( get_the_date( '', $post_id ) )
			);
		}

		$list_items_markup .= "</li>\n";
	}

	$class = "wp-block-latest-posts align{$align}";
	if ( isset( $attributes['layout'] ) && 'grid' === $attributes['layout'] ) {
		$class .= ' is-grid';
	}

	if ( isset( $attributes['columns'] ) ) {
		$class .= ' columns-' . $attributes['columns'];
	}

	$block_content = sprintf(
		'<ul class="%1$s">%2$s</ul>',
		esc_attr( $class ),
		$list_items_markup
	);

	return $block_content;
}

register_block_type( 'core/latest-posts', array(
	'render_callback' => 'gutenberg_render_block_core_latest_posts',
) );
