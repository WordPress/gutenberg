<?php
/**
 * Server-side registration and rendering of the `core/latest-posts` block.
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
function gutenberg_render_core_latest_posts_block( $attributes ) {
	$recent_posts = wp_get_recent_posts( array(
		'numberposts' => $attributes['postsToShow'],
		'post_status' => 'publish',
		'order'       => $attributes['order'],
		'orderby'     => $attributes['orderBy'],
		'category'    => $attributes['categories'],
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
	if ( isset( $attributes['postLayout'] ) && 'grid' === $attributes['postLayout'] ) {
		$class .= ' is-grid';
	}

	if ( isset( $attributes['columns'] ) && 'grid' === $attributes['postLayout'] ) {
		$class .= ' columns-' . $attributes['columns'];
	}

	$block_content = sprintf(
		'<ul class="%1$s">%2$s</ul>',
		esc_attr( $class ),
		$list_items_markup
	);

	return $block_content;
}

/**
 * Registers the `core/latest-posts` block on the server-side.
 *
 * @since 2.7.0
 */
function register_core_latest_posts_block() {
	wp_register_script(
		'core-latest-posts-block',
		gutenberg_url( '/build/__block_latestPosts.js' ),
		array( 'wp-blocks', 'wp-i18n', 'wp-components', 'wp-element', 'wp-utils' )
	);

	wp_register_style(
		'core-latest-posts-block',
		gutenberg_url( '/build/__block_latestPosts.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_latestPosts.css' )
	);

	wp_style_add_data( 'core-latest-posts-block', 'rtl', 'replace' );

	wp_register_style(
		'core-latest-posts-block-editor',
		gutenberg_url( '/build/__block_latestPosts_editor.css' ),
		array(),
		filemtime( gutenberg_dir_path() . 'build/__block_latestPosts_editor.css' )
	);

	wp_style_add_data( 'core-latest-posts-block-editor', 'rtl', 'replace' );

	register_block_type( 'core/latest-posts', array(
		'style'           => 'core-latest-posts-block',
		'editor_style'    => 'core-latest-posts-block-editor',
		'editor_script'   => 'core-latest-posts-block',
		'attributes'      => array(
			'categories'      => array(
				'type' => 'string',
			),
			'postsToShow'     => array(
				'type'    => 'number',
				'default' => 5,
			),
			'displayPostDate' => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'postLayout'      => array(
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
			'order'           => array(
				'type'    => 'string',
				'default' => 'desc',
			),
			'orderBy'         => array(
				'type'    => 'string',
				'default' => 'date',
			),
		),
		'render_callback' => 'gutenberg_render_core_latest_posts_block',
	) );
}

add_action( 'init', 'register_core_latest_posts_block' );
