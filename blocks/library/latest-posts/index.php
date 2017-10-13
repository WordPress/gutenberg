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
	$recent_posts = wp_get_recent_posts( array(
		'numberposts' => $attributes['postsToShow'],
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

	$class = "wp-block-latest-posts align{$attributes['align']}";
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
	'attributes'      => array(
		'postsToShow'     => array(
			'type'    => 'number',
			'default' => 5,
		),
		'displayPostDate' => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'layout'          => array(
			'type'    => 'string',
			'default' => 'list',
		),
		'columns'         => array(
			'type'    => 'number',
			'default' => 3,
		),
		'align'           => array(
			'type'    => 'string',
			'default' => 'center',
		),
	),
	'render_callback' => 'gutenberg_render_block_core_latest_posts',
) );
